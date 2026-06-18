package com.fixy.house.team.application.dto.request

import com.fixy.house.team.domain.vo.TeamRole
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotNull

data class ChangeMemberRoleRequest(
    @field:Schema(description = "새 권한 (OWNER / MANAGER / MEMBER)", example = "MANAGER")
    @field:NotNull
    val role: TeamRole
)
