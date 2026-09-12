package com.airballoon.ws;

import com.airballoon.auth.AuthService;
import com.airballoon.domain.GameRound;
import com.airballoon.repository.GameRoundRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * WebSocket-обработчик для /ws/game/{roundId}.
 *
 * Поддерживает N одновременных подключений на раунд. При подключении
 * отправляет снимок состояния игры (GAME_STATE) и дальше рассылает
 * игровые события.
 */
@Component
public class GameWebSocketHandler implements WebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(GameWebSocketHandler.class);

    private final Map<Long, Set<WebSocketSession>> subscriptions = new ConcurrentHashMap<>();
    private final GameRoundRepository roundRepository;
    private final ObjectMapper objectMapper;
    private final AuthService authService;

    public GameWebSocketHandler(GameRoundRepository roundRepository, ObjectMapper objectMapper, AuthService authService) {
        this.roundRepository = roundRepository;
        this.objectMapper = objectMapper;
        this.authService = authService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        long roundId = extractRoundId(session);
        if (roundId < 0) {
            send(session, Map.of("type", "ERROR", "error", "Некорректный roundId"));
            close(session);
            return;
        }
        try {
            long userId = authService.requireUserIdFromToken(extractToken(session));
            GameRound round = roundRepository.findById(roundId).orElse(null);
            if (round == null || !round.getUserId().equals(userId)) {
                send(session, Map.of("type", "ERROR", "error", "Раунд не найден"));
                close(session);
                return;
            }
        } catch (RuntimeException exception) {
            send(session, Map.of("type", "ERROR", "error", exception.getMessage()));
            close(session);
            return;
        }
        subscriptions.computeIfAbsent(roundId, k -> ConcurrentHashMap.newKeySet()).add(session);
        send(session, gameState(roundId));
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
        if (message instanceof TextMessage text
                && "ping".equalsIgnoreCase(text.getPayload().trim())) {
            send(session, Map.of("type", "PONG"));
        }
        // Остальные входящие сообщения игнорируются: игра управляется сервером.
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket transport error: {}", exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        long roundId = extractRoundId(session);
        if (roundId >= 0) {
            Set<WebSocketSession> sessions = subscriptions.get(roundId);
            if (sessions != null) {
                sessions.remove(session);
            }
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
/** Рассылка события всем подключённым к раунду клиентам. */
    public void broadcast(long roundId, Map<String, Object> event) {
        Set<WebSocketSession> sessions = subscriptions.get(roundId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }
        String json = toJson(event);
        for (WebSocketSession session : sessions) {
            synchronized (session) {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(json));
                    }
                } catch (IOException | RuntimeException ex) {
                    log.warn("Не удалось отправить WebSocket-сообщение: {}", ex.getMessage());
                    sessions.remove(session);
                }
            }
        }
    }

    /** Снимок состояния раунда при подключении. */
    private Map<String, Object> gameState(long roundId) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("type", "GAME_STATE");
        roundRepository.findById(roundId).ifPresentOrElse(round -> {
            state.put("roundId", round.getId());
            state.put("theme", round.getTheme().name());
            state.put("status", round.getStatus().name());
            state.put("level", round.getCurrentLevel());
            state.put("baseMultiplier", round.getBaseMultiplier());
            state.put("multiplier", round.getCurrentMultiplier());
            state.put("betAmount", round.getBetAmount());
            state.put("boosterMultiplier", round.getBoosterMultiplier());
            state.put("points", round.getPoints());
            state.put("winAmount", round.getWinAmount());
            state.put("cashoutMultiplier", round.getCashoutMultiplier());
            state.put("serverSeedHash", round.getServerSeedHash());
        }, () -> state.put("error", "Раунд не найден: " + roundId));
        return state;
    }

    private long extractRoundId(WebSocketSession session) {
        try {
            if (session.getUri() == null) {
                return -1;
            }
            String path = session.getUri().getPath();
            String last = path.substring(path.lastIndexOf('/') + 1);
            return Long.parseLong(last);
        } catch (RuntimeException e) {
            return -1;
        }
    }

    private String extractToken(WebSocketSession session) {
        if (session.getUri() == null) return null;
        return UriComponentsBuilder.fromUri(session.getUri()).build()
                .getQueryParams().getFirst("token");
    }

    private void send(WebSocketSession session, Map<String, Object> event) {
        synchronized (session) {
            try {
                session.sendMessage(new TextMessage(toJson(event)));
            } catch (IOException | RuntimeException e) {
                log.warn("Не удалось отправить WebSocket-сообщение: {}", e.getMessage());
                close(session);
            }
        }
    }

    private void close(WebSocketSession session) {
        try {
            session.close(CloseStatus.NORMAL);
        } catch (IOException | RuntimeException ignored) {
            // сессия уже закрыта
        }
    }

    private String toJson(Map<String, Object> event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException e) {
            log.error("Не удалось сериализовать WebSocket-событие", e);
            return "{\"type\":\"ERROR\",\"error\":\"serialization\"}";
        }
    }
}
