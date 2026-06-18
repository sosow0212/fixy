package com.fixy.house.global.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {

    private val securitySchemeName = "bearerAuth"

    @Bean
    fun houseOpenApi(): OpenAPI {
        val securityScheme = SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .`in`(SecurityScheme.In.HEADER)
            .name("Authorization")

        return OpenAPI()
            .info(
                Info()
                    .title("fixy-house API")
                    .description(
                        "fixy-agent 의 작업 데이터를 모으고, 팀 업무 문서·개인 시크릿을 함께 관리하는 운영 공간."
                    )
                    .version("v0.0.1")
            )
            .addSecurityItem(SecurityRequirement().addList(securitySchemeName))
            .components(
                Components()
                    .addSecuritySchemes(securitySchemeName, securityScheme)
            )
    }
}
