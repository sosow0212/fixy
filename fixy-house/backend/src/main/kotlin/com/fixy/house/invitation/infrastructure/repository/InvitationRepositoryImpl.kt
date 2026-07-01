package com.fixy.house.invitation.infrastructure.repository

import com.fixy.house.invitation.domain.Invitation
import com.fixy.house.invitation.domain.InvitationRepository
import com.fixy.house.invitation.domain.vo.InvitationStatus
import com.fixy.house.invitation.infrastructure.entity.InvitationEntity
import org.springframework.stereotype.Repository

@Repository
class InvitationRepositoryImpl(
    private val invitationMongoRepository: InvitationMongoRepository
) : InvitationRepository {

    override fun findById(invitationId: String): Invitation? =
        invitationMongoRepository.findById(invitationId).orElse(null)?.toDomain()

    override fun findByTokenHash(tokenHash: String): Invitation? =
        invitationMongoRepository.findByTokenHash(tokenHash)?.toDomain()

    override fun findAllByTeamId(teamId: String): List<Invitation> =
        invitationMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun findAllByTeamIdAndStatus(teamId: String, status: InvitationStatus): List<Invitation> =
        invitationMongoRepository.findAllByTeamIdAndStatus(teamId, status).map { it.toDomain() }

    override fun findAllByInvitedEmailAndStatus(email: String, status: InvitationStatus): List<Invitation> =
        invitationMongoRepository.findAllByInvitedEmailAndStatus(email, status).map { it.toDomain() }

    override fun save(invitation: Invitation): Invitation =
        invitationMongoRepository.save(InvitationEntity.from(invitation)).toDomain()

    override fun delete(invitation: Invitation) {
        invitation.id?.let { invitationMongoRepository.deleteById(it) }
    }
}
