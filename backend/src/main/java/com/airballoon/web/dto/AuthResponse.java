package com.airballoon.web.dto;

public record AuthResponse(String token, UserDto user) {
}
