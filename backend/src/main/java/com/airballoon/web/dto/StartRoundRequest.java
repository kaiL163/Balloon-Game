package com.airballoon.web.dto;

/**
 * Тело запроса POST /api/game/rounds.
 * Фронтенд НЕ передаёт crash, booster, multiplier или win — только тему и ставку.
 */
public record StartRoundRequest(String theme, String bet) {
}