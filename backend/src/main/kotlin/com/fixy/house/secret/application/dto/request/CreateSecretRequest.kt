package com.fixy.house.secret.application.dto.request

import com.fixy.house.secret.domain.vo.SecretScope
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class CreateSecretRequest(
    @field:Schema(description = "시크릿 키 (UPPERCASE/숫자/언더스코어 2~64자)", example = "OPENAI_API_KEY")
    @field:NotBlank
    @field:Pattern(regexp = "^[A-Z0-9_]{2,64}$", message = "key 는 [A-Z0-9_]{2,64}")
    val key: String,

    @field:Schema(description = "평문 값 (저장 시 AES-256-GCM 으로 암호화)")
    @field:NotBlank
    @field:Size(max = 4096)
    val value: String,

    @field:Schema(description = "PERSONAL = 본인만, TEAM = 팀 멤버")
    val scope: SecretScope = SecretScope.PERSONAL,

    @field:Schema(description = "TEAM 스코프일 때 팀 ID (필수)", example = "team-1")
    val teamId: String? = null,

    @field:Schema(description = "설명 / 용도 메모")
    val description: String? = null
)
