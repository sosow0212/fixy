package com.fixy.house.document.application.dto.request

import com.fixy.house.document.domain.vo.DocumentVisibility
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateDocPageRequest(
    @field:Schema(description = "페이지 제목", example = "주간 회의록")
    @field:NotBlank
    @field:Size(max = 200)
    val title: String,

    @field:Schema(description = "본문 (Markdown)")
    val content: String? = null,

    @field:Schema(description = "상위 페이지 ID (null = 최상위)")
    val parentId: String? = null,

    @field:Schema(description = "가시성 (TEAM = 팀 전체, PRIVATE = 작성자만)")
    val visibility: DocumentVisibility? = null,

    @field:Schema(description = "태그 목록")
    val tags: List<String> = emptyList(),

    @field:Schema(description = "정렬 순서")
    val orderIndex: Int = 0
)
