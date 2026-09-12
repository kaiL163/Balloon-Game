package com.airballoon.config;

import com.airballoon.domain.Theme;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Параметры игры (секция {@code game} в application.yml).
 */
@ConfigurationProperties(prefix = "game")
public class GameProperties {

    private int greenLevels = 9;
    private int redLevels = 12;

    public int maxLevel(Theme theme) {
        return theme == Theme.RED ? redLevels : greenLevels;
    }

    public int getGreenLevels() {
        return greenLevels;
    }

    public void setGreenLevels(int greenLevels) {
        this.greenLevels = greenLevels;
    }

    public int getRedLevels() {
        return redLevels;
    }

    public void setRedLevels(int redLevels) {
        this.redLevels = redLevels;
    }

}
