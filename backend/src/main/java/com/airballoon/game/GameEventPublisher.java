package com.airballoon.game;

import java.util.Map;

/**
 * Публикация игровых событий (WebSocket). В тестах подменяется моком.
 */
public interface GameEventPublisher {

    void publish(long roundId, Map<String, Object> event);
}