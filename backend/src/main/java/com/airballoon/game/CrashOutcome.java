package com.airballoon.game;

import java.math.BigDecimal;

/**
 * Заранее определённые crash и booster для раунда.
 */
public record CrashOutcome(int crashLevel, BigDecimal crashMultiplier, int boosterLevel) {
}