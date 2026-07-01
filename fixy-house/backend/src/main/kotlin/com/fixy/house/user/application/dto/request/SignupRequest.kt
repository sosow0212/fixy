package com.fixy.house.user.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SignupRequest(
    @field:Schema(description = "이메일", example = "user@example.com")
    @field:NotBlank
    @field:Email
    val email: String,

    @field:Schema(description = "비밀번호 (8자 이상, 영문+숫자)", example = "fixy1234")
    @field:NotBlank
    @field:Size(min = 8, max = 64)
    val password: String,

    @field:Schema(description = "표시 이름", example = "Fixy User")
    @field:NotBlank
    @field:Size(min = 2, max = 30)
    val displayName: String
)
