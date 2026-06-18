package com.fixy.house.user.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank

data class RefreshTokenRequest(
    @field:Schema(description = "리프레시 토큰 (JWT)")
    @field:NotBlank
    val refreshToken: String
)
