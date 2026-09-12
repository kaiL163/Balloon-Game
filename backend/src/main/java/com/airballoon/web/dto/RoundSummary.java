package com.airballoon.web.dto;

import com.airballoon.domain.GameRound;
import com.airballoon.domain.RoundStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Строка истории раунда.
 */
public record RoundSummary(
        long id,
        Instant date,
        String theme,
        String bet,
        BigDecimal betAmount,
        Integer boosterLevel,
        BigDecimal themeMaxMultiplier,
        String status,
        String result,
        int crashLevel,
        BigDecimal crashMultiplier,
        BigDecimal cashoutMultiplier,
        BigDecimal winAmount,
        int points) {

    public static RoundSummary from(GameRound round) {
        return new RoundSummary(
                round.getId(),
                round.getCreatedAt(),
                round.getTheme() == null ? null : round.getTheme().name(),
                "x" + round.getBoosterMultiplier().stripTrailingZeros().toPlainString(),
                round.getBetAmount(),
                round.getBoosterLevel(),
                round.getThemeMaxMultiplier(),
                round.getStatus().name(),
                result(round),
                round.getCrashLevel(),
                round.getCrashMultiplier(),
                round.getCashoutMultiplier(),
                round.getWinAmount(),
                round.getPoints());
    }

    private static String result(GameRound round) {
        if (round.getStatus() == RoundStatus.CRASHED) {
            return "CRASH";
        }
        if (round.getStatus() == RoundStatus.FINISHED) {
            return "CASHOUT";
        }
        return "IN_PROGRESS";
    }
}
