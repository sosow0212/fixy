package com.fixy.house.team.infrastructure.entity

import com.fixy.house.global.MongoAuditableEntity
import com.fixy.house.team.domain.Team
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field

@Document(collection = "teams")
class TeamEntity(
    @Id
    var id: String? = null,

    @Field(name = "name")
    var name: String,

    @Indexed(unique = true)
    @Field(name = "slug")
    var slug: String,

    @Field(name = "owner_user_id")
    var ownerUserId: String,

    @Field(name = "description")
    var description: String? = null,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): Team = Team(
        id = id,
        name = name,
        slug = slug,
        ownerUserId = ownerUserId,
        description = description
    ).also { it.createdAt = createdAt; it.updatedAt = updatedAt }

    companion object {
        fun from(domain: Team): TeamEntity = TeamEntity(
            id = domain.id,
            name = domain.name,
            slug = domain.slug,
            ownerUserId = domain.ownerUserId,
            description = domain.description
        ).also { entity ->
            domain.createdAt = entity.createdAt
            domain.updatedAt = entity.updatedAt
        }
    }
}
