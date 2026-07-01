package com.fixy.house.document.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size

data class UpdateSpaceRequest(
    @field:Schema(description = "변경할 이름")
    @field:Size(max = 50)
    val name: String? = null,

    @field:Schema(description = "변경할 설명 (null = 유지, 빈 문자열 = 비우기)")
    val description: String? = null,

    @field:Schema(description = "변경할 아이콘 (null = 유지, 빈 문자열 = 비우기)")
    val icon: String? = null,

    @field:Schema(description = "변경할 정렬 순서")
    val orderIndex: Int? = null
)
