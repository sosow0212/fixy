package com.fixy.house.invitation.application.dto.request

import com.fixy.house.team.domain.vo.TeamRole
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

data class InviteMemberRequest(
    @field:Schema(description = "초대할 이메일", example = "newbie@example.com")
    @field:NotBlank
    @field:Email
    val email: String,

    @field:Schema(description = "초대 시 부여할 권한", example = "MEMBER")
    @field:NotNull
    val role: TeamRole
)
