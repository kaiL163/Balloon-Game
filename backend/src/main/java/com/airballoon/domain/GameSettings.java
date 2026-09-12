package com.airballoon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "game_settings")
public class GameSettings {

    @Id
    private Integer id;

    @Column(name = "green_max_multiplier", nullable = false, precision = 10, scale = 2)
    private BigDecimal greenMaxMultiplier;

    @Column(name = "red_max_multiplier", nullable = false, precision = 10, scale = 2)
    private BigDecimal redMaxMultiplier;

    @Column(name = "multiplier_growth_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal multiplierGrowthRate;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "game_id", nullable = false, length = 50)
    private String gameId;

    @Column(name = "game_name", nullable = false, length = 100)
    private String gameName;

    @Column(name = "game_type", nullable = false, length = 30)
    private String gameType;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "crash_distribution", nullable = false, length = 30)
    private String crashDistribution;

    @Column(name = "house_edge", nullable = false, precision = 8, scale = 6)
    private BigDecimal houseEdge;

    @Column(name = "min_crash_multiplier", nullable = false, precision = 10, scale = 2)
    private BigDecimal minCrashMultiplier;

    @Column(nullable = false)
    private int fps;

    @Column(name = "green_booster_probabilities", nullable = false, length = 500)
    private String greenBoosterProbabilities;

    @Column(name = "red_booster_probabilities", nullable = false, length = 600)
    private String redBoosterProbabilities;

    @Column(name = "multiplier_tier_1_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal multiplierTier1Value;

    @Column(name = "multiplier_tier_2_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal multiplierTier2Value;

    @Column(name = "multiplier_tier_3_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal multiplierTier3Value;

    @Column(name = "multiplier_tier_4_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal multiplierTier4Value;

    @Column(name = "points_per_line", nullable = false)
    private int pointsPerLine;

    @Column(name = "points_cashout_bonus", nullable = false)
    private int pointsCashoutBonus;

    @Column(name = "points_xn_bonus", nullable = false)
    private int pointsXnBonus;

    @Column(name = "bet_tier_1_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal betTier1Amount;

    @Column(name = "bet_tier_2_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal betTier2Amount;

    @Column(name = "bet_tier_3_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal betTier3Amount;

    @Column(name = "bet_tier_4_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal betTier4Amount;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public BigDecimal getGreenMaxMultiplier() { return greenMaxMultiplier; }
    public void setGreenMaxMultiplier(BigDecimal value) { this.greenMaxMultiplier = value; }
    public BigDecimal getRedMaxMultiplier() { return redMaxMultiplier; }
    public void setRedMaxMultiplier(BigDecimal value) { this.redMaxMultiplier = value; }
    public BigDecimal getMultiplierGrowthRate() { return multiplierGrowthRate; }
    public void setMultiplierGrowthRate(BigDecimal value) { this.multiplierGrowthRate = value; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getGameId() { return gameId; }
    public void setGameId(String value) { this.gameId = value; }
    public String getGameName() { return gameName; }
    public void setGameName(String value) { this.gameName = value; }
    public String getGameType() { return gameType; }
    public void setGameType(String value) { this.gameType = value; }
    public boolean isActive() { return active; }
    public void setActive(boolean value) { this.active = value; }
    public String getCrashDistribution() { return crashDistribution; }
    public void setCrashDistribution(String value) { this.crashDistribution = value; }
    public BigDecimal getHouseEdge() { return houseEdge; }
    public void setHouseEdge(BigDecimal value) { this.houseEdge = value; }
    public BigDecimal getMinCrashMultiplier() { return minCrashMultiplier; }
    public void setMinCrashMultiplier(BigDecimal value) { this.minCrashMultiplier = value; }
    public int getFps() { return fps; }
    public void setFps(int value) { this.fps = value; }
    public String getGreenBoosterProbabilities() { return greenBoosterProbabilities; }
    public void setGreenBoosterProbabilities(String value) { this.greenBoosterProbabilities = value; }
    public String getRedBoosterProbabilities() { return redBoosterProbabilities; }
    public void setRedBoosterProbabilities(String value) { this.redBoosterProbabilities = value; }
    public BigDecimal getMultiplierTier1Value() { return multiplierTier1Value; }
    public void setMultiplierTier1Value(BigDecimal value) { this.multiplierTier1Value = value; }
    public BigDecimal getMultiplierTier2Value() { return multiplierTier2Value; }
    public void setMultiplierTier2Value(BigDecimal value) { this.multiplierTier2Value = value; }
    public BigDecimal getMultiplierTier3Value() { return multiplierTier3Value; }
    public void setMultiplierTier3Value(BigDecimal value) { this.multiplierTier3Value = value; }
    public BigDecimal getMultiplierTier4Value() { return multiplierTier4Value; }
    public void setMultiplierTier4Value(BigDecimal value) { this.multiplierTier4Value = value; }
    public int getPointsPerLine() { return pointsPerLine; }
    public void setPointsPerLine(int value) { this.pointsPerLine = value; }
    public int getPointsCashoutBonus() { return pointsCashoutBonus; }
    public void setPointsCashoutBonus(int value) { this.pointsCashoutBonus = value; }
    public int getPointsXnBonus() { return pointsXnBonus; }
    public void setPointsXnBonus(int value) { this.pointsXnBonus = value; }
    public BigDecimal getBetTier1Amount() { return betTier1Amount; }
    public void setBetTier1Amount(BigDecimal value) { this.betTier1Amount = value; }
    public BigDecimal getBetTier2Amount() { return betTier2Amount; }
    public void setBetTier2Amount(BigDecimal value) { this.betTier2Amount = value; }
    public BigDecimal getBetTier3Amount() { return betTier3Amount; }
    public void setBetTier3Amount(BigDecimal value) { this.betTier3Amount = value; }
    public BigDecimal getBetTier4Amount() { return betTier4Amount; }
    public void setBetTier4Amount(BigDecimal value) { this.betTier4Amount = value; }
}
