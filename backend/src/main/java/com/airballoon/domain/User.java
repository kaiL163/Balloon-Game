package com.airballoon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Пользователь игры.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 20)
    private String role = "USER";

    /** Бонусный баланс (деньги). */
    @Column(name = "bonus_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal bonusBalance = new BigDecimal("0.00");

    /** Очки за игру. Хранятся отдельно от баланса. */
    @Column(name = "game_points", nullable = false)
    private int gamePoints;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public BigDecimal getBonusBalance() {
        return bonusBalance;
    }

    public void setBonusBalance(BigDecimal bonusBalance) {
        this.bonusBalance = bonusBalance;
    }

    public int getGamePoints() {
        return gamePoints;
    }

    public void setGamePoints(int gamePoints) {
        this.gamePoints = gamePoints;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
