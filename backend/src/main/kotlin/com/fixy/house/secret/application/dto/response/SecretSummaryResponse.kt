package com.fixy.house.secret.application.dto.response

import com.fixy.house.secret.domain.Secret
import com.fixy.house.secret.domain.vo.SecretScope
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class SecretSummaryResponse(
    @Schema(description = "시크릿 ID") val id: String,
    @Schema(description = "소유자 userId") val ownerUserId: String,
    @Schema(description = "시크릿 키") val key: String,
    @Schema(description = "스코프") val scope: SecretScope,
    @Schema(description = "팀 ID (TEAM 스코프)") val teamId: String?,
    @Schema(description = "설명") val description: String?,
    @Schema(description = "마지막 사용 시각") val lastUsedAt: Instant?,
    @Schema(description = "생성 시각") val createdAt: Instant?,
    @Schema(description = "수정 시각") val updatedAt: Instant?
) {
    companion object {
        fun from(secret: Secret): SecretSummaryResponse = SecretSummaryResponse(
            id = secret.id.orEmpty(),
            ownerUserId = secret.ownerUserId,
            key = secret.secretKey,
            scope = secret.scope,
            teamId = secret.teamId,
            description = secret.description,
            lastUsedAt = secret.lastUsedAt,
            createdAt = secret.createdAt,
            updatedAt = secret.updatedAt
        )
    }
}
