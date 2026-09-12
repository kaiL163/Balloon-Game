package com.airballoon.game;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Блокировки по пользователю и по раунду.
 * Гарантируют, что кэшаут не выполнится дважды и не сработает одновременно
 * с продвижением раунда (для однопроцессного бэкенда).
 */
@Component
public class RoundLock {

    private final Map<String, Object> locks = new ConcurrentHashMap<>();

    public Object user(Long userId) {
        return locks.computeIfAbsent("u:" + userId, k -> new Object());
    }

    public Object round(Long roundId) {
        return locks.computeIfAbsent("r:" + roundId, k -> new Object());
    }
}