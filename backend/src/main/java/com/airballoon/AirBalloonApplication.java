package com.airballoon;

import com.airballoon.config.CrashProperties;
import com.airballoon.config.GameProperties;
import com.airballoon.config.RewardProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({
        GameProperties.class,
        CrashProperties.class,
        RewardProperties.class
})
public class AirBalloonApplication {

    public static void main(String[] args) {
        SpringApplication.run(AirBalloonApplication.class, args);
    }
}
