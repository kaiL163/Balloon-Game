package com.airballoon.web.dto;

import java.math.BigDecimal;

/**
 * Проверка честности (Provably Fair): после окончания игры сервер
 * раскрывает seed и предопределённые crash/booster.
 */
public record FairnessResponse(
        long roundId,
        String theme,
        String serverSeed,
        String serverSeedHash,
        int crashLevel,
        Integer boosterLevel,
        BigDecimal crashMultiplier,
        BigDecimal boosterMultiplier) {
}