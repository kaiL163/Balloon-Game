package com.airballoon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Награда, выданная пользователю за завершённый раунд.
 */
@Entity
@Table(name = "user_rewards")
public class UserReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reward_id", nullable = false)
    private Long rewardId;

    @Column(name = "game_round_id", nullable = false)
    private Long gameRoundId;

    @Column(name = "awarded_at", nullable = false)
    private Instant awardedAt;

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

    public Long getRewardId() {
        return rewardId;
    }

    public void setRewardId(Long rewardId) {
        this.rewardId = rewardId;
    }

    public Long getGameRoundId() {
        return gameRoundId;
    }

    public void setGameRoundId(Long gameRoundId) {
        this.gameRoundId = gameRoundId;
    }

    public Instant getAwardedAt() {
        return awardedAt;
    }

    public void setAwardedAt(Instant awardedAt) {
        this.awardedAt = awardedAt;
    }
}