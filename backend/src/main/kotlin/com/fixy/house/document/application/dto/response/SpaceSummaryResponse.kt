package com.fixy.house.document.application.dto.response

import com.fixy.house.document.domain.Space
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class SpaceSummaryResponse(
    @Schema(description = "스페이스 ID") val id: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "이름") val name: String,
    @Schema(description = "슬러그") val slug: String,
    @Schema(description = "설명") val description: String?,
    @Schema(description = "아이콘") val icon: String?,
    @Schema(description = "정렬 순서") val orderIndex: Int,
    @Schema(description = "생성자 userId") val createdByUserId: String,
    @Schema(description = "생성 시각") val createdAt: Instant?,
    @Schema(description = "수정 시각") val updatedAt: Instant?
) {
    companion object {
        fun from(space: Space): SpaceSummaryResponse = SpaceSummaryResponse(
            id = space.id.orEmpty(),
            teamId = space.teamId,
            name = space.name,
            slug = space.slug,
            description = space.description,
            icon = space.icon,
            orderIndex = space.orderIndex,
            createdByUserId = space.createdByUserId,
            createdAt = space.createdAt,
            updatedAt = space.updatedAt
        )
    }
}
