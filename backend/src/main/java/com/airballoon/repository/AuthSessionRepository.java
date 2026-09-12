package com.airballoon.repository;

import com.airballoon.domain.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    void deleteAllByUserId(Long userId);
    void deleteAllByExpiresAtBefore(Instant instant);
}
