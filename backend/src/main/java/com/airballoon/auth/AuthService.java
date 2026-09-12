package com.airballoon.auth;

import com.airballoon.domain.AuthSession;
import com.airballoon.domain.User;
import com.airballoon.exception.ApiException;
import com.airballoon.repository.AuthSessionRepository;
import com.airballoon.repository.UserRepository;
import com.airballoon.web.dto.AuthResponse;
import com.airballoon.web.dto.UserDto;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final Duration SESSION_TTL = Duration.ofDays(30);
    private static final String DEMO_EMAIL = "test@test.com";
    private static final String DEMO_PASSWORD = "test123";

    private final UserRepository users;
    private final AuthSessionRepository sessions;
    private final String adminEmail;
    private final String adminPassword;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository users,
                       AuthSessionRepository sessions,
                       @Value("${app.admin.email:admin@admin.com}") String adminEmail,
                       @Value("${app.admin.password:admin123}") String adminPassword) {
        this.users = users;
        this.sessions = sessions;
        this.adminEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        this.adminPassword = adminPassword;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeAccounts() {
        users.findByEmailIgnoreCase(DEMO_EMAIL).ifPresent(user -> {
            if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
                users.save(user);
            }
        });

        User admin = users.findByEmailIgnoreCase(adminEmail).orElseGet(() -> {
            User created = new User();
            created.setEmail(adminEmail);
            created.setUsername(uniqueUsername("admin"));
            created.setPasswordHash(passwordEncoder.encode(adminPassword));
            created.setBonusBalance(new BigDecimal("10000.00"));
            created.setGamePoints(0);
            created.setCreatedAt(Instant.now());
            return created;
        });
        admin.setRole("ADMIN");
        if (admin.getPasswordHash() == null || admin.getPasswordHash().isBlank()) {
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        }
        users.save(admin);
    }

    @Transactional
    public AuthResponse register(String rawEmail, String password) {
        String email = normalizeEmail(rawEmail);
        validatePassword(password);
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("Этот email уже зарегистрирован");
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(uniqueUsername(email.substring(0, email.indexOf('@'))));
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("USER");
        user.setBonusBalance(new BigDecimal("1000.00"));
        user.setGamePoints(0);
        user.setCreatedAt(Instant.now());
        users.save(user);
        return issueSession(user);
    }

    @Transactional
    public AuthResponse login(String rawEmail, String password) {
        String email = normalizeEmail(rawEmail);
        User user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized("Неверный email или пароль"));
        if (password == null || user.getPasswordHash() == null
                || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.unauthorized("Неверный email или пароль");
        }
        return issueSession(user);
    }

    @Transactional
    public void logout(String authorization) {
        String token = bearerToken(authorization);
        sessions.deleteById(token);
    }

    @Transactional(readOnly = true)
    public long requireUserId(String authorization) {
        return requireUserIdFromToken(bearerToken(authorization));
    }

    @Transactional(readOnly = true)
    public long requireUserIdFromToken(String token) {
        if (token == null || token.isBlank()) {
            throw ApiException.unauthorized("Требуется авторизация");
        }
        AuthSession session = sessions.findById(token)
                .orElseThrow(() -> ApiException.unauthorized("Сессия недействительна"));
        if (!session.getExpiresAt().isAfter(Instant.now())) {
            throw ApiException.unauthorized("Сессия истекла");
        }
        return session.getUserId();
    }

    @Transactional(readOnly = true)
    public long requireAdmin(String authorization) {
        long userId = requireUserId(authorization);
        User user = users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));
        if (!"ADMIN".equals(user.getRole())) {
            throw ApiException.forbidden("Доступ разрешён только администратору");
        }
        return userId;
    }

    private AuthResponse issueSession(User user) {
        Instant now = Instant.now();
        sessions.deleteAllByExpiresAtBefore(now);
        AuthSession session = new AuthSession();
        session.setToken(UUID.randomUUID().toString());
        session.setUserId(user.getId());
        session.setCreatedAt(now);
        session.setExpiresAt(now.plus(SESSION_TTL));
        sessions.save(session);
        return new AuthResponse(session.getToken(), UserDto.from(user));
    }

    private String normalizeEmail(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (email.length() > 255 || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw ApiException.badRequest("Укажите корректный email");
        }
        return email;
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw ApiException.badRequest("Пароль должен быть не короче 6 символов");
        }
        if (password.length() > 72) {
            throw ApiException.badRequest("Пароль должен быть не длиннее 72 символов");
        }
    }

    private String uniqueUsername(String emailPrefix) {
        String base = emailPrefix.replaceAll("[^a-zA-Z0-9_-]", "");
        if (base.isBlank()) base = "pilot";
        if (base.length() > 40) base = base.substring(0, 40);
        String candidate = base;
        int suffix = 1;
        while (users.existsByUsername(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private String bearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw ApiException.unauthorized("Требуется авторизация");
        }
        return authorization.substring(7).trim();
    }
}
