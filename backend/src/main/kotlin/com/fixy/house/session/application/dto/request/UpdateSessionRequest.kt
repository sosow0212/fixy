package com.fixy.house.session.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema

data class UpdateSessionRequest(
    @field:Schema(description = "세션 요약 (사용자/매니저가 다는 메모)")
    val summary: String? = null,

    @field:Schema(description = "태그 (사용자/매니저가 분류)")
    val tags: List<String>? = null
)
