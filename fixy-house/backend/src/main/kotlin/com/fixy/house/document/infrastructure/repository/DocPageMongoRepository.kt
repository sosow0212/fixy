package com.fixy.house.document.infrastructure.repository

import com.fixy.house.document.infrastructure.entity.DocPageEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface DocPageMongoRepository : MongoRepository<DocPageEntity, String> {
    fun findByTeamIdAndId(teamId: String, id: String): DocPageEntity?
    fun findAllByTeamIdAndSpaceId(teamId: String, spaceId: String): List<DocPageEntity>
    fun findAllByTeamIdAndSpaceIdAndParentId(teamId: String, spaceId: String, parentId: String?): List<DocPageEntity>
    fun findAllByTeamId(teamId: String): List<DocPageEntity>
}
