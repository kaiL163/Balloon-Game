package com.airballoon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Игровой раунд.
 *
 * Поля crash и booster заполняются сервером до начала игры
 * и не сообщаются клиенту (клиент до конца игры видит только serverSeedHash).
 */
@Entity
@Table(name = "game_rounds")
public class GameRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Theme theme;

    @Column(name = "bet_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal betAmount;

    /** Множитель бустера (x1 -> 1, x2 -> 2, ...). Для x1 бустера нет. */
    @Column(name = "booster_multiplier", nullable = false, precision = 19, scale = 2)
    private BigDecimal boosterMultiplier = BigDecimal.ONE;

    @Column(name = "crash_level", nullable = false)
    private int crashLevel;

    @Column(name = "crash_multiplier", nullable = false, precision = 19, scale = 2)
    private BigDecimal crashMultiplier;

    /** Максимальный коэффициент темы на момент создания раунда. */
    @Column(name = "theme_max_multiplier", nullable = false, precision = 10, scale = 2)
    private BigDecimal themeMaxMultiplier;

    /** Уровень бустера. null — бустер отсутствует (ставка x1). */
    @Column(name = "booster_level")
    private Integer boosterLevel;

    @Column(name = "current_level", nullable = false)
    private int currentLevel;

    @Column(name = "current_multiplier", nullable = false, precision = 19, scale = 2)
    private BigDecimal currentMultiplier = BigDecimal.ONE;

    /** Базовый коэффициент без бустера. Растёт плавно между уровнями. */
    @Column(name = "base_multiplier", nullable = false, precision = 19, scale = 4)
    private BigDecimal baseMultiplier = BigDecimal.ONE;

    @Column(name = "cashout_multiplier", precision = 19, scale = 2)
    private BigDecimal cashoutMultiplier;

    @Column(name = "win_amount", precision = 19, scale = 2)
    private BigDecimal winAmount;

    @Column(nullable = false)
    private int points;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoundStatus status;

    @Column(name = "server_seed", nullable = false, length = 64)
    private String serverSeed;

    @Column(name = "server_seed_hash", nullable = false, length = 64)
    private String serverSeedHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "cashout_at")
    private Instant cashoutAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Theme getTheme() {
        return theme;
    }

    public void setTheme(Theme theme) {
        this.theme = theme;
    }

    public BigDecimal getBetAmount() {
        return betAmount;
    }

    public void setBetAmount(BigDecimal betAmount) {
        this.betAmount = betAmount;
    }

    public BigDecimal getBoosterMultiplier() {
        return boosterMultiplier;
    }

    public void setBoosterMultiplier(BigDecimal boosterMultiplier) {
        this.boosterMultiplier = boosterMultiplier;
    }

    public int getCrashLevel() {
        return crashLevel;
    }

    public void setCrashLevel(int crashLevel) {
        this.crashLevel = crashLevel;
    }

    public BigDecimal getCrashMultiplier() {
        return crashMultiplier;
    }

    public void setCrashMultiplier(BigDecimal crashMultiplier) {
        this.crashMultiplier = crashMultiplier;
    }

    public BigDecimal getThemeMaxMultiplier() {
        return themeMaxMultiplier;
    }

    public void setThemeMaxMultiplier(BigDecimal themeMaxMultiplier) {
        this.themeMaxMultiplier = themeMaxMultiplier;
    }

    public Integer getBoosterLevel() {
        return boosterLevel;
    }

    public void setBoosterLevel(Integer boosterLevel) {
        this.boosterLevel = boosterLevel;
    }

    public int getCurrentLevel() {
        return currentLevel;
    }

    public void setCurrentLevel(int currentLevel) {
        this.currentLevel = currentLevel;
    }

    public BigDecimal getCurrentMultiplier() {
        return currentMultiplier;
    }

    public void setCurrentMultiplier(BigDecimal currentMultiplier) {
        this.currentMultiplier = currentMultiplier;
    }

    public BigDecimal getBaseMultiplier() {
        return baseMultiplier;
    }

    public void setBaseMultiplier(BigDecimal baseMultiplier) {
        this.baseMultiplier = baseMultiplier;
    }

    public BigDecimal getCashoutMultiplier() {
        return cashoutMultiplier;
    }

    public void setCashoutMultiplier(BigDecimal cashoutMultiplier) {
        this.cashoutMultiplier = cashoutMultiplier;
    }

    public BigDecimal getWinAmount() {
        return winAmount;
    }

    public void setWinAmount(BigDecimal winAmount) {
        this.winAmount = winAmount;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public RoundStatus getStatus() {
        return status;
    }

    public void setStatus(RoundStatus status) {
        this.status = status;
    }

    public String getServerSeed() {
        return serverSeed;
    }

    public void setServerSeed(String serverSeed) {
        this.serverSeed = serverSeed;
    }

    public String getServerSeedHash() {
        return serverSeedHash;
    }

    public void setServerSeedHash(String serverSeedHash) {
        this.serverSeedHash = serverSeedHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCashoutAt() {
        return cashoutAt;
    }

    public void setCashoutAt(Instant cashoutAt) {
        this.cashoutAt = cashoutAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }
}
