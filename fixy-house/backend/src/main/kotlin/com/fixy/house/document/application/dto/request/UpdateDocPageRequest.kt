package com.fixy.house.document.application.dto.request

import com.fixy.house.document.domain.vo.DocumentVisibility
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size

data class UpdateDocPageRequest(
    @field:Schema(description = "변경할 제목")
    @field:Size(max = 200)
    val title: String? = null,

    @field:Schema(description = "변경할 본문 (null = 유지, 빈 문자열 = 비우기)")
    val content: String? = null,

    @field:Schema(description = "변경할 가시성")
    val visibility: DocumentVisibility? = null,

    @field:Schema(description = "변경할 태그 목록")
    val tags: List<String>? = null,

    @field:Schema(description = "변경할 정렬 순서")
    val orderIndex: Int? = null,

    @field:Schema(description = "이동할 상위 페이지 ID (null = 최상위로)")
    val parentId: String? = null
)
