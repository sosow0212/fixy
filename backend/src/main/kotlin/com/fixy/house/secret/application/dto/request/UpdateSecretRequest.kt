package com.fixy.house.secret.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size

data class UpdateSecretRequest(
    @field:Schema(description = "새 평문 값 (제공되면 재암호화)")
    @field:Size(max = 4096)
    val value: String? = null,

    @field:Schema(description = "변경할 설명 (null = 유지, 빈 문자열 = 비우기)")
    val description: String? = null
)
