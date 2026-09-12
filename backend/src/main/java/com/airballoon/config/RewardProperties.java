package com.airballoon.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Пороги наград (секция {@code reward} в application.yml).
 */
@ConfigurationProperties(prefix = "reward")
public class RewardProperties {

    /** Если пройдено <= commonMaxLevel уровней — COMMON. */
    private int commonMaxLevel = 3;
    /** Если пройдено <= rareMaxLevel уровней — RARE, иначе EPIC. */
    private int rareMaxLevel = 6;

    public int getCommonMaxLevel() {
        return commonMaxLevel;
    }

    public void setCommonMaxLevel(int commonMaxLevel) {
        this.commonMaxLevel = commonMaxLevel;
    }

    public int getRareMaxLevel() {
        return rareMaxLevel;
    }

    public void setRareMaxLevel(int rareMaxLevel) {
        this.rareMaxLevel = rareMaxLevel;
    }
}