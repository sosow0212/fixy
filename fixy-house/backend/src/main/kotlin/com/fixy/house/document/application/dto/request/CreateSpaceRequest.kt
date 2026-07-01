package com.fixy.house.document.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class CreateSpaceRequest(
    @field:Schema(description = "스페이스 이름", example = "엔진 룸")
    @field:NotBlank
    @field:Size(max = 50)
    val name: String,

    @field:Schema(description = "URL 슬러그 (소문자/숫자/하이픈, 2~40자). 비우면 자동 생성", example = "engine-room")
    @field:Pattern(regexp = "^[a-z0-9-]{2,40}$", message = "slug 는 [a-z0-9-]{2,40}")
    val slug: String? = null,

    @field:Schema(description = "스페이스 설명")
    val description: String? = null,

    @field:Schema(description = "아이콘 (이모지 또는 URL)")
    val icon: String? = null,

    @field:Schema(description = "정렬 순서 (작을수록 위)", example = "0")
    val orderIndex: Int = 0
)
