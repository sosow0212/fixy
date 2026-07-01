package com.fixy.house.secret.infrastructure.repository

import com.fixy.house.secret.domain.vo.SecretScope
import com.fixy.house.secret.infrastructure.entity.SecretEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface SecretMongoRepository : MongoRepository<SecretEntity, String> {
    fun findByOwnerUserIdAndSecretKeyAndScope(
        ownerUserId: String,
        secretKey: String,
        scope: SecretScope
    ): SecretEntity?

    fun findAllByOwnerUserId(ownerUserId: String): List<SecretEntity>
    fun findAllByTeamId(teamId: String): List<SecretEntity>
}
