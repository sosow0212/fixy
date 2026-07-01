package com.fixy.house.secret.domain

import com.fixy.house.secret.domain.vo.SecretScope

interface SecretRepository {
    fun findById(secretId: String): Secret?
    fun findByOwnerUserIdAndSecretKeyAndScope(
        ownerUserId: String,
        secretKey: String,
        scope: SecretScope
    ): Secret?

    fun findAllByOwnerUserId(ownerUserId: String): List<Secret>
    fun findAllByTeamId(teamId: String): List<Secret>
    fun save(secret: Secret): Secret
    fun delete(secret: Secret)
}
