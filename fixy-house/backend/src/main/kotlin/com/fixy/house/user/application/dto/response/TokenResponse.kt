package com.fixy.house.user.application.dto.response

import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class TokenResponse(
    @Schema(description = "토큰 타입", example = "Bearer") val grantType: String,
    @Schema(description = "액세스 토큰 (JWT)") val accessToken: String,
    @Schema(description = "액세스 토큰 만료 시각 (epoch ms)") val accessTokenExpiresAt: Instant,
    @Schema(description = "리프레시 토큰 (JWT)") val refreshToken: String,
    @Schema(description = "리프레시 토큰 만료 시각 (epoch ms)") val refreshTokenExpiresAt: Instant
)
