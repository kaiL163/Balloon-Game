package com.airballoon.web.dto;

import java.math.BigDecimal;

/**
 * Ответ на POST /api/game/rounds/{id}/cashout.
 */
public record CashoutResponse(
        long roundId,
        BigDecimal multiplier,
        BigDecimal win,
        String status,
        int points) {
}