package com.fixy.house.user.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class LoginRequest(
    @field:Schema(description = "이메일", example = "user@example.com")
    @field:NotBlank
    @field:Email
    val email: String,

    @field:Schema(description = "비밀번호")
    @field:NotBlank
    val password: String
)
