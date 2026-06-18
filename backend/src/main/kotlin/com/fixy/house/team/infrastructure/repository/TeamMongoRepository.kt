package com.fixy.house.team.infrastructure.repository

import com.fixy.house.team.infrastructure.entity.TeamEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface TeamMongoRepository : MongoRepository<TeamEntity, String> {
    fun findBySlug(slug: String): TeamEntity?
    fun existsBySlug(slug: String): Boolean
}
