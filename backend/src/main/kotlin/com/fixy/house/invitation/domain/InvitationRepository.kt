package com.fixy.house.invitation.domain

import com.fixy.house.invitation.domain.vo.InvitationStatus

interface InvitationRepository {
    fun findById(invitationId: String): Invitation?
    fun findByTokenHash(tokenHash: String): Invitation?
    fun findAllByTeamId(teamId: String): List<Invitation>
    fun findAllByTeamIdAndStatus(teamId: String, status: InvitationStatus): List<Invitation>
    fun findAllByInvitedEmailAndStatus(email: String, status: InvitationStatus): List<Invitation>
    fun save(invitation: Invitation): Invitation
    fun delete(invitation: Invitation)
}
