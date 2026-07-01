package com.fixy.house.document.infrastructure.repository

import com.fixy.house.document.infrastructure.entity.SpaceEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface SpaceMongoRepository : MongoRepository<SpaceEntity, String> {
    fun findByTeamIdAndId(teamId: String, id: String): SpaceEntity?
    fun findByTeamIdAndSlug(teamId: String, slug: String): SpaceEntity?
    fun findAllByTeamId(teamId: String): List<SpaceEntity>
    fun existsByTeamIdAndSlug(teamId: String, slug: String): Boolean
}
