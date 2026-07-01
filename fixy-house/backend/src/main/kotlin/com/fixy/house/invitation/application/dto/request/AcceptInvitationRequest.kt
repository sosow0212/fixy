package com.fixy.house.invitation.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class AcceptInvitationRequest(
    @field:Schema(description = "초대 토큰 (평문, 1회용)")
    @field:NotBlank
    val token: String,

    @field:Schema(description = "수락자 이메일 (초대된 이메일과 일치해야 함)", example = "newbie@example.com")
    @field:NotBlank
    @field:Email
    val email: String,

    @field:Schema(description = "신규 사용자인 경우 비밀번호")
    val password: String? = null,

    @field:Schema(description = "신규 사용자인 경우 표시 이름")
    val displayName: String? = null
)
