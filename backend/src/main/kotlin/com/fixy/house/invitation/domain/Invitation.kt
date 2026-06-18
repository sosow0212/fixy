package com.fixy.house.invitation.domain

import com.fixy.house.global.BaseEntity
import com.fixy.house.invitation.domain.vo.InvitationStatus
import com.fixy.house.team.domain.vo.TeamRole
import java.time.Instant

class Invitation(
    var id: String? = null,
    var teamId: String,
    var invitedEmail: String,
    var role: TeamRole,
    var tokenHash: String,
    var status: InvitationStatus,
    var invitedByUserId: String,
    var expiresAt: Instant,
    var acceptedAt: Instant? = null,
    var acceptedByUserId: String? = null
) : BaseEntity() {

    init {
        require(teamId.isNotBlank()) { "팀 ID 는 비어 있을 수 없습니다." }
        require(invitedEmail.isNotBlank()) { "초대 이메일은 비어 있을 수 없습니다." }
        require(tokenHash.isNotBlank()) { "토큰 해시는 비어 있을 수 없습니다." }
        require(invitedByUserId.isNotBlank()) { "초대자 사용자 ID 는 비어 있을 수 없습니다." }
    }

    fun accept(userId: String, now: Instant) {
        check(status == InvitationStatus.PENDING) { "대기 중인 초대만 수락할 수 있습니다." }
        check(now.isBefore(expiresAt)) { "만료된 초대입니다." }
        this.status = InvitationStatus.ACCEPTED
        this.acceptedAt = now
        this.acceptedByUserId = userId
    }

    fun revoke() {
        check(status == InvitationStatus.PENDING) { "대기 중인 초대만 취소할 수 있습니다." }
        this.status = InvitationStatus.REVOKED
    }

    fun markExpired(now: Instant) {
        if (status == InvitationStatus.PENDING && now.isAfter(expiresAt)) {
            this.status = InvitationStatus.EXPIRED
        }
    }
}
