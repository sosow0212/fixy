package com.fixy.house.invitation.application.dto.response

import com.fixy.house.invitation.domain.Invitation
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class InvitationResponse(
    @Schema(description = "초대 ID") val id: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "초대된 이메일") val invitedEmail: String,
    @Schema(description = "부여할 권한") val role: String,
    @Schema(description = "초대 상태") val status: String,
    @Schema(description = "만료 시각") val expiresAt: Instant,
    @Schema(description = "수락 시각") val acceptedAt: Instant?,
    @Schema(description = "초대자 사용자 ID") val invitedByUserId: String,
    @Schema(description = "수락자 사용자 ID") val acceptedByUserId: String?,
    @Schema(description = "생성 시각") val createdAt: Instant?,
    @Schema(description = "초대 토큰 (생성 시점에만 노출, 이후 null)") val token: String?
) {
    companion object {
        fun from(invitation: Invitation, token: String? = null): InvitationResponse = InvitationResponse(
            id = invitation.id.orEmpty(),
            teamId = invitation.teamId,
            invitedEmail = invitation.invitedEmail,
            role = invitation.role.name,
            status = invitation.status.name,
            expiresAt = invitation.expiresAt,
            acceptedAt = invitation.acceptedAt,
            invitedByUserId = invitation.invitedByUserId,
            acceptedByUserId = invitation.acceptedByUserId,
            createdAt = invitation.createdAt,
            token = token
        )
    }
}
