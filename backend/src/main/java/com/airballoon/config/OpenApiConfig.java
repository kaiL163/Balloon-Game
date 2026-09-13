package com.airballoon.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI airBalloonOpenApi() {
        final String bearer = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("Воздушный Шар API")
                        .version("0.1.0")
                        .description("""
                                REST API игры «Воздушный Шар».

                                Через этот интерфейс можно независимо проверить:
                                старт раунда, cashout, начисления, историю и применение конфигурации.

                                Авторизация: заголовок `Authorization: Bearer <token>` после `/api/auth/login`.
                                """))
                .components(new Components().addSecuritySchemes(bearer,
                        new SecurityScheme()
                                .name(bearer)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("UUID")))
                .addSecurityItem(new SecurityRequirement().addList(bearer));
    }
}
