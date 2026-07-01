package com.fixy.house.secret.infrastructure.repository

import com.fixy.house.secret.domain.Secret
import com.fixy.house.secret.domain.SecretRepository
import com.fixy.house.secret.domain.vo.SecretScope
import com.fixy.house.secret.infrastructure.entity.SecretEntity
import org.springframework.stereotype.Repository

@Repository
class SecretRepositoryImpl(
    private val secretMongoRepository: SecretMongoRepository
) : SecretRepository {

    override fun findById(secretId: String): Secret? =
        secretMongoRepository.findById(secretId).orElse(null)?.toDomain()

    override fun findByOwnerUserIdAndSecretKeyAndScope(
        ownerUserId: String,
        secretKey: String,
        scope: SecretScope
    ): Secret? = secretMongoRepository
        .findByOwnerUserIdAndSecretKeyAndScope(ownerUserId, secretKey, scope)
        ?.toDomain()

    override fun findAllByOwnerUserId(ownerUserId: String): List<Secret> =
        secretMongoRepository.findAllByOwnerUserId(ownerUserId).map { it.toDomain() }

    override fun findAllByTeamId(teamId: String): List<Secret> =
        secretMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun save(secret: Secret): Secret =
        secretMongoRepository.save(SecretEntity.from(secret)).toDomain()

    override fun delete(secret: Secret) {
        secret.id?.let { secretMongoRepository.deleteById(it) }
    }
}
