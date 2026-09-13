package com.airballoon.web.dto;

import com.airballoon.domain.OperationLog;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * Запись журнала операций для API-проверки серверной модели.
 */
public record OperationLogDto(
        long id,
        Long userId,
        Long roundId,
        String operation,
        Map<String, Object> details,
        Instant createdAt) {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    public static OperationLogDto from(OperationLog entry) {
        Map<String, Object> details;
        try {
            details = MAPPER.readValue(entry.getDetails(), MAP_TYPE);
        } catch (Exception ex) {
            details = Collections.singletonMap("raw", entry.getDetails());
        }
        return new OperationLogDto(
                entry.getId(),
                entry.getUserId(),
                entry.getRoundId(),
                entry.getOperation(),
                details,
                entry.getCreatedAt());
    }
}
