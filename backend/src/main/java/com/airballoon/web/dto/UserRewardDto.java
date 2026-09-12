package com.airballoon.web.dto;

import java.time.Instant;

/**
 * Награда пользователя (GET /api/users/me/rewards).
 */
public record UserRewardDto(
        long id,
        long rewardId,
        long roundId,
        String code,
        String name,
        String description,
        Instant awardedAt) {
}