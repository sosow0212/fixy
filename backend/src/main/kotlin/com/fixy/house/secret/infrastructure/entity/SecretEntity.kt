package com.fixy.house.secret.infrastructure.entity

import com.fixy.house.global.MongoAuditableEntity
import com.fixy.house.secret.domain.Secret
import com.fixy.house.secret.domain.vo.SecretScope
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "secrets")
@CompoundIndexes(
    CompoundIndex(
        name = "owner_key_scope_unique",
        def = "{'owner_user_id': 1, 'secret_key': 1, 'scope': 1}",
        unique = true
    )
)
class SecretEntity(
    @Id
    var id: String? = null,

    @Field(name = "owner_user_id")
    var ownerUserId: String,

    @Field(name = "secret_key")
    var secretKey: String,

    @Field(name = "encrypted_value")
    var encryptedValue: String,

    @Field(name = "iv")
    var iv: String,

    @Field(name = "auth_tag")
    var authTag: String,

    @Field(name = "scope")
    var scope: SecretScope,

    @Field(name = "team_id")
    var teamId: String? = null,

    @Field(name = "description")
    var description: String? = null,

    @Field(name = "last_used_at")
    var lastUsedAt: Instant? = null,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): Secret = Secret(
        id = id,
        ownerUserId = ownerUserId,
        secretKey = secretKey,
        encryptedValue = encryptedValue,
        iv = iv,
        authTag = authTag,
        scope = scope,
        teamId = teamId,
        description = description,
        lastUsedAt = lastUsedAt
    ).also {
        it.createdAt = createdAt
        it.updatedAt = updatedAt
    }

    companion object {
        fun from(domain: Secret): SecretEntity = SecretEntity(
            id = domain.id,
            ownerUserId = domain.ownerUserId,
            secretKey = domain.secretKey,
            encryptedValue = domain.encryptedValue,
            iv = domain.iv,
            authTag = domain.authTag,
            scope = domain.scope,
            teamId = domain.teamId,
            description = domain.description,
            lastUsedAt = domain.lastUsedAt
        ).also { entity ->
            domain.createdAt = entity.createdAt
            domain.updatedAt = entity.updatedAt
        }
    }
}
