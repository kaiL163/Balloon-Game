package com.airballoon.game;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Периодический тик игрового движка. Частота берётся из административных
 * настроек; короткий системный polling позволяет менять FPS без перезапуска.
 */
@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class GameTickScheduler {

    private final GameEngine gameEngine;
    private final GameSettingsService settingsService;
    private volatile long lastTickNanos;

    public GameTickScheduler(GameEngine gameEngine, GameSettingsService settingsService) {
        this.gameEngine = gameEngine;
        this.settingsService = settingsService;
    }

    @Scheduled(fixedDelay = 5)
    public void tick() {
        long now = System.nanoTime();
        long interval = 1_000_000_000L / Math.max(1, settingsService.fps());
        if (now - lastTickNanos < interval) return;
        lastTickNanos = now;
        gameEngine.tick();
    }
}
