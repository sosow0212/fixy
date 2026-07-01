package com.fixy.house.secret.domain

import com.fixy.house.global.BaseEntity
import com.fixy.house.secret.domain.vo.SecretScope
import java.time.Instant

class Secret(
    var id: String? = null,
    var ownerUserId: String,
    var secretKey: String,
    var encryptedValue: String,
    var iv: String,
    var authTag: String,
    var scope: SecretScope,
    var teamId: String? = null,
    var description: String? = null,
    var lastUsedAt: Instant? = null
) : BaseEntity() {

    init {
        require(ownerUserId.isNotBlank()) { "ownerUserId 는 비어 있을 수 없습니다." }
        require(SECRET_KEY_REGEX.matches(secretKey)) { "secretKey 는 $SECRET_KEY_REGEX 패턴을 따라야 합니다." }
        require(encryptedValue.isNotBlank()) { "encryptedValue 는 비어 있을 수 없습니다." }
        require(iv.isNotBlank()) { "iv 는 비어 있을 수 없습니다." }
        require(authTag.isNotBlank()) { "authTag 는 비어 있을 수 없습니다." }
        if (scope == SecretScope.TEAM) {
            require(!teamId.isNullOrBlank()) { "TEAM 스코프는 teamId 가 필요합니다." }
        }
    }

    fun updateEncrypted(encryptedValue: String, iv: String, authTag: String) {
        require(encryptedValue.isNotBlank()) { "encryptedValue 는 비어 있을 수 없습니다." }
        require(iv.isNotBlank()) { "iv 는 비어 있을 수 없습니다." }
        require(authTag.isNotBlank()) { "authTag 는 비어 있을 수 없습니다." }
        this.encryptedValue = encryptedValue
        this.iv = iv
        this.authTag = authTag
    }

    fun updateDescription(newDescription: String?) {
        this.description = newDescription
    }

    fun markUsed(now: Instant = Instant.now()) {
        this.lastUsedAt = now
    }

    companion object {
        private val SECRET_KEY_REGEX = Regex("^[A-Z0-9_]{2,64}$")

        fun create(
            ownerUserId: String,
            secretKey: String,
            encryptedValue: String,
            iv: String,
            authTag: String,
            scope: SecretScope,
            teamId: String?,
            description: String?
        ): Secret = Secret(
            ownerUserId = ownerUserId,
            secretKey = secretKey,
            encryptedValue = encryptedValue,
            iv = iv,
            authTag = authTag,
            scope = scope,
            teamId = teamId,
            description = description
        )
    }
}
