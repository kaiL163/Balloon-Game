package com.airballoon.web.dto;

import com.airballoon.domain.GameRound;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Публичные данные раунда. Точка crash и serverSeed остаются скрытыми до
 * завершения; линия сундука видна игроку во время полёта.
 */
public record RoundResponse(
        long id,
        String theme,
        String status,
        BigDecimal betAmount,
        BigDecimal boosterMultiplier,
        Integer boosterLevel,
        BigDecimal themeMaxMultiplier,
        int currentLevel,
        BigDecimal baseMultiplier,
        BigDecimal currentMultiplier,
        int points,
        String serverSeedHash,
        Instant createdAt,
        BigDecimal cashoutMultiplier,
        Instant cashoutAt,
        BigDecimal winAmount) {

    public static RoundResponse from(GameRound round) {
        return new RoundResponse(
                round.getId(),
                round.getTheme() == null ? null : round.getTheme().name(),
                round.getStatus().name(),
                round.getBetAmount(),
                round.getBoosterMultiplier(),
                round.getBoosterLevel(),
                round.getThemeMaxMultiplier(),
                round.getCurrentLevel(),
                round.getBaseMultiplier(),
                round.getCurrentMultiplier(),
                round.getPoints(),
                round.getServerSeedHash(),
                round.getCreatedAt(),
                round.getCashoutMultiplier(),
                round.getCashoutAt(),
                round.getWinAmount());
    }
}
