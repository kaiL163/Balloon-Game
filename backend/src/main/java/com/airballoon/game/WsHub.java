package com.airballoon.game;

import com.airballoon.ws.GameWebSocketHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;

/**
 * Реализация GameEventPublisher: рассылает события в WebSocket-сессии раунда.
 */
@Component
public class WsHub implements GameEventPublisher {

    private final GameWebSocketHandler webSocketHandler;

    public WsHub(GameWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void publish(long roundId, Map<String, Object> event) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            webSocketHandler.broadcast(roundId, event);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                webSocketHandler.broadcast(roundId, event);
            }
        });
    }
}
