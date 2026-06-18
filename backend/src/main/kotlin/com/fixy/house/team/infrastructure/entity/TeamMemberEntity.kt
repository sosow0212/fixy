package com.fixy.house.team.infrastructure.entity

import com.fixy.house.global.MongoAuditableEntity
import com.fixy.house.team.domain.TeamMember
import com.fixy.house.team.domain.vo.TeamRole
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "team_members")
@CompoundIndexes(
    CompoundIndex(name = "team_member_unique", def = "{'team_id': 1, 'user_id': 1}", unique = true)
)
class TeamMemberEntity(
    @Id
    var id: String? = null,

    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "user_id")
    var userId: String,

    @Field(name = "role")
    var role: TeamRole,

    @Field(name = "joined_at")
    var joinedAt: Instant,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): TeamMember = TeamMember(
        id = id,
        teamId = teamId,
        userId = userId,
        role = role,
        joinedAt = joinedAt
    ).also { it.createdAt = createdAt; it.updatedAt = updatedAt }

    companion object {
        fun from(domain: TeamMember): TeamMemberEntity = TeamMemberEntity(
            id = domain.id,
            teamId = domain.teamId,
            userId = domain.userId,
            role = domain.role,
            joinedAt = domain.joinedAt
        ).also { entity ->
            domain.createdAt = entity.createdAt
            domain.updatedAt = entity.updatedAt
        }
    }
}
