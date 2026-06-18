package com.fixy.house.invitation.infrastructure.repository

import com.fixy.house.invitation.domain.vo.InvitationStatus
import com.fixy.house.invitation.infrastructure.entity.InvitationEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface InvitationMongoRepository : MongoRepository<InvitationEntity, String> {
    fun findByTokenHash(tokenHash: String): InvitationEntity?
    fun findAllByTeamId(teamId: String): List<InvitationEntity>
    fun findAllByTeamIdAndStatus(teamId: String, status: InvitationStatus): List<InvitationEntity>
    fun findAllByInvitedEmailAndStatus(email: String, status: InvitationStatus): List<InvitationEntity>
}
