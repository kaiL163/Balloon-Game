package com.airballoon.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Аварийный технический предел. Рабочая crash-модель хранится в game_settings.
 */
@ConfigurationProperties(prefix = "crash")
public class CrashProperties {

    private double maxMultiplier = 100.0;

    public double getMaxMultiplier() {
        return maxMultiplier;
    }

    public void setMaxMultiplier(double maxMultiplier) {
        this.maxMultiplier = maxMultiplier;
    }

}
