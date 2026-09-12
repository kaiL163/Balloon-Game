package com.airballoon.ws;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.beans.factory.annotation.Value;

/**
 * Регистрирует WebSocket-эндпоинт /ws/game/{roundId}.
 *
 * @EnableWebSocket подключает DelegatingWebSocketConfiguration, которая
 * автоматически находит все бины WebSocketConfigurer и регистрирует хендлеры
 * во встроенном Tomcat.
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final GameWebSocketHandler webSocketHandler;
    private final String[] allowedOriginPatterns;

    public WebSocketConfig(
            GameWebSocketHandler webSocketHandler,
            @Value("${app.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*}") String allowedOriginPatterns) {
        this.webSocketHandler = webSocketHandler;
        this.allowedOriginPatterns = allowedOriginPatterns.split(",");
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/ws/game/{roundId}")
                .setAllowedOriginPatterns(allowedOriginPatterns);
    }
}
