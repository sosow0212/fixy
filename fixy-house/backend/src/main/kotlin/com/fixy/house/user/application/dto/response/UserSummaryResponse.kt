package com.fixy.house.user.application.dto.response

import com.fixy.house.user.domain.User
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class UserSummaryResponse(
    @Schema(description = "사용자 ID") val id: String,
    @Schema(description = "이메일") val email: String,
    @Schema(description = "표시 이름") val displayName: String,
    @Schema(description = "권한") val role: String,
    @Schema(description = "마지막 로그인 시각") val lastLoginAt: Instant?,
    @Schema(description = "계정 생성 시각") val createdAt: Instant?
) {
    companion object {
        fun from(user: User): UserSummaryResponse = UserSummaryResponse(
            id = user.id.orEmpty(),
            email = user.email,
            displayName = user.displayName,
            role = user.role.name,
            lastLoginAt = user.lastLoginAt,
            createdAt = user.createdAt
        )
    }
}
