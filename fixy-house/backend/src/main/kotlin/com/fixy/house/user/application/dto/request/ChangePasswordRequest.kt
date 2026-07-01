package com.fixy.house.user.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class ChangePasswordRequest(
    @field:Schema(description = "현재 비밀번호")
    @field:NotBlank
    val currentPassword: String,

    @field:Schema(description = "새 비밀번호 (8자 이상, 영문+숫자)")
    @field:NotBlank
    @field:Size(min = 8, max = 64)
    val newPassword: String
)
