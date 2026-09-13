package com.airballoon.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Простой health-check. Дополняет, но не заменяет проверку игровых операций.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", "air-balloon-backend");
        body.put("timestamp", Instant.now().toString());
        return body;
    }
}
