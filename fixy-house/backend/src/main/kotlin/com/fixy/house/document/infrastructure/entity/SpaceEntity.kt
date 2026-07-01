package com.fixy.house.document.infrastructure.entity

import com.fixy.house.document.domain.Space
import com.fixy.house.global.MongoAuditableEntity
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field

@Document(collection = "spaces")
@CompoundIndexes(
    CompoundIndex(name = "team_slug_unique", def = "{'team_id': 1, 'slug': 1}", unique = true)
)
class SpaceEntity(
    @Id
    var id: String? = null,

    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "name")
    var name: String,

    @Field(name = "slug")
    var slug: String,

    @Field(name = "description")
    var description: String? = null,

    @Field(name = "icon")
    var icon: String? = null,

    @Field(name = "order_index")
    var orderIndex: Int = 0,

    @Field(name = "created_by_user_id")
    var createdByUserId: String,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): Space = Space(
        id = id,
        teamId = teamId,
        name = name,
        slug = slug,
        description = description,
        icon = icon,
        orderIndex = orderIndex,
        createdByUserId = createdByUserId
    ).also {
        it.createdAt = createdAt
        it.updatedAt = updatedAt
    }

    companion object {
        fun from(domain: Space): SpaceEntity = SpaceEntity(
            id = domain.id,
            teamId = domain.teamId,
            name = domain.name,
            slug = domain.slug,
            description = domain.description,
            icon = domain.icon,
            orderIndex = domain.orderIndex,
            createdByUserId = domain.createdByUserId
        ).also { entity ->
            entity.createdAt = domain.createdAt
            entity.updatedAt = domain.updatedAt
        }
    }
}
