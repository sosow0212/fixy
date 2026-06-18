package com.fixy.house.team.application.dto.response

import com.fixy.house.team.domain.Team
import com.fixy.house.team.domain.vo.TeamRole
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class TeamSummaryResponse(
    @Schema(description = "팀 ID") val id: String,
    @Schema(description = "팀 이름") val name: String,
    @Schema(description = "팀 슬러그") val slug: String,
    @Schema(description = "소유자 사용자 ID") val ownerUserId: String,
    @Schema(description = "팀 설명") val description: String?,
    @Schema(description = "조회자의 권한") val myRole: String,
    @Schema(description = "팀 생성 시각") val createdAt: Instant?
) {
    companion object {
        fun from(team: Team, myRole: TeamRole? = null): TeamSummaryResponse = TeamSummaryResponse(
            id = team.id.orEmpty(),
            name = team.name,
            slug = team.slug,
            ownerUserId = team.ownerUserId,
            description = team.description,
            myRole = myRole?.name.orEmpty(),
            createdAt = team.createdAt
        )
    }
}
