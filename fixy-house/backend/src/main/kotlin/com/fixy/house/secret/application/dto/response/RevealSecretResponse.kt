package com.fixy.house.secret.application.dto.response

import com.fixy.house.secret.domain.vo.SecretScope
import io.swagger.v3.oas.annotations.media.Schema

data class RevealSecretResponse(
    @Schema(description = "시크릿 ID") val id: String,
    @Schema(description = "시크릿 키") val key: String,
    @Schema(description = "스코프") val scope: SecretScope,
    @Schema(description = "평문 값 (감사 로그 기록됨)") val plaintext: String
)
