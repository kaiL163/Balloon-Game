package com.airballoon.web.dto;

import java.math.BigDecimal;

/**
 * Пользователь (GET /api/users/me).
 */
public record UserDto(
        long id,
        String username,
        BigDecimal bonusBalance,
        int gamePoints,
        String role) {

    public static UserDto from(com.airballoon.domain.User user) {
        return new UserDto(user.getId(), user.getUsername(), user.getBonusBalance(), user.getGamePoints(), user.getRole());
    }
}
