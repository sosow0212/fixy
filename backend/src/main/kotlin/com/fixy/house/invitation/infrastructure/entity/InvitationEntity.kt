package com.fixy.house.invitation.infrastructure.entity

import com.fixy.house.global.MongoAuditableEntity
import com.fixy.house.invitation.domain.Invitation
import com.fixy.house.invitation.domain.vo.InvitationStatus
import com.fixy.house.team.domain.vo.TeamRole
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "invitations")
class InvitationEntity(
    @Id
    var id: String? = null,

    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "invited_email")
    var invitedEmail: String,

    @Field(name = "role")
    var role: TeamRole,

    @Indexed(unique = true)
    @Field(name = "token_hash")
    var tokenHash: String,

    @Field(name = "status")
    var status: InvitationStatus,

    @Field(name = "invited_by_user_id")
    var invitedByUserId: String,

    @Field(name = "expires_at")
    var expiresAt: Instant,

    @Field(name = "accepted_at")
    var acceptedAt: Instant? = null,

    @Field(name = "accepted_by_user_id")
    var acceptedByUserId: String? = null,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): Invitation = Invitation(
        id = id,
        teamId = teamId,
        invitedEmail = invitedEmail,
        role = role,
        tokenHash = tokenHash,
        status = status,
        invitedByUserId = invitedByUserId,
        expiresAt = expiresAt,
        acceptedAt = acceptedAt,
        acceptedByUserId = acceptedByUserId
    ).also { it.createdAt = createdAt; it.updatedAt = updatedAt }

    companion object {
        fun from(domain: Invitation): InvitationEntity = InvitationEntity(
            id = domain.id,
            teamId = domain.teamId,
            invitedEmail = domain.invitedEmail,
            role = domain.role,
            tokenHash = domain.tokenHash,
            status = domain.status,
            invitedByUserId = domain.invitedByUserId,
            expiresAt = domain.expiresAt,
            acceptedAt = domain.acceptedAt,
            acceptedByUserId = domain.acceptedByUserId
        ).also { entity ->
            entity.createdAt = domain.createdAt
            entity.updatedAt = domain.updatedAt
        }
    }
}
