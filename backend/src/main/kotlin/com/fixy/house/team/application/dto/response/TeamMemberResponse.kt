package com.fixy.house.team.application.dto.response

import com.fixy.house.team.domain.TeamMember
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class TeamMemberResponse(
    @Schema(description = "멤버 ID") val id: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "사용자 ID") val userId: String,
    @Schema(description = "권한") val role: String,
    @Schema(description = "팀 가입 시각") val joinedAt: Instant
) {
    companion object {
        fun from(member: TeamMember): TeamMemberResponse = TeamMemberResponse(
            id = member.id.orEmpty(),
            teamId = member.teamId,
            userId = member.userId,
            role = member.role.name,
            joinedAt = member.joinedAt
        )
    }
}
