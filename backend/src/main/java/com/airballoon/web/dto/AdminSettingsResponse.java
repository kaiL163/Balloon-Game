package com.airballoon.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminSettingsResponse(
        String gameId, String gameName, String gameType, boolean active, String crashDistribution,
        BigDecimal houseEdge, BigDecimal minCrashMultiplier,
        BigDecimal greenMaxMultiplier, BigDecimal redMaxMultiplier,
        BigDecimal multiplierGrowthRate, int fps, BigDecimal delta,
        List<BigDecimal> greenBoosterProbabilities, List<BigDecimal> redBoosterProbabilities,
        BigDecimal multiplierTier1Value, BigDecimal multiplierTier2Value,
        BigDecimal multiplierTier3Value, BigDecimal multiplierTier4Value,
        BigDecimal betTier1Amount, BigDecimal betTier2Amount,
        BigDecimal betTier3Amount, BigDecimal betTier4Amount,
        int pointsPerLine, int pointsCashoutBonus, int pointsXnBonus,
        Instant updatedAt) {
}
