package com.airballoon.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record GameConfigResponse(
        String gameId,
        String gameName,
        String gameType,
        boolean active,
        BigDecimal greenMaxMultiplier,
        BigDecimal redMaxMultiplier,
        List<BigDecimal> boosterTierValues,
        List<BigDecimal> betTierAmounts) {
}
