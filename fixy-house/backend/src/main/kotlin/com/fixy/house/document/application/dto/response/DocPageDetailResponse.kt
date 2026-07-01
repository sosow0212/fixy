package com.fixy.house.document.application.dto.response

import com.fixy.house.document.domain.DocPage
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class DocPageDetailResponse(
    @Schema(description = "페이지 ID") val id: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "스페이스 ID") val spaceId: String,
    @Schema(description = "상위 페이지 ID") val parentId: String?,
    @Schema(description = "제목") val title: String,
    @Schema(description = "본문 (Markdown)") val content: String,
    @Schema(description = "정렬 순서") val orderIndex: Int,
    @Schema(description = "가시성") val visibility: com.fixy.house.document.domain.vo.DocumentVisibility,
    @Schema(description = "작성자 userId") val authorUserId: String,
    @Schema(description = "최근 수정자 userId") val lastEditorUserId: String,
    @Schema(description = "태그") val tags: List<String>,
    @Schema(description = "생성 시각") val createdAt: Instant?,
    @Schema(description = "수정 시각") val updatedAt: Instant?
) {
    companion object {
        fun from(page: DocPage): DocPageDetailResponse = DocPageDetailResponse(
            id = page.id.orEmpty(),
            teamId = page.teamId,
            spaceId = page.spaceId,
            parentId = page.parentId,
            title = page.title,
            content = page.content,
            orderIndex = page.orderIndex,
            visibility = page.visibility,
            authorUserId = page.authorUserId,
            lastEditorUserId = page.lastEditorUserId,
            tags = page.tags,
            createdAt = page.createdAt,
            updatedAt = page.updatedAt
        )
    }
}
