package com.fixy.house.invitation.infrastructure.policy

import com.fixy.house.invitation.domain.policy.InvitationTokenGenerator
import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

@Component
class SecureRandomInvitationTokenGenerator : InvitationTokenGenerator {

    private val secureRandom = SecureRandom()

    override fun generateRawToken(): String {
        val bytes = ByteArray(RAW_TOKEN_BYTES)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    override fun hashToken(raw: String): String {
        val digest = MessageDigest.getInstance(HASH_ALGORITHM)
        val hash = digest.digest(raw.toByteArray(Charsets.UTF_8))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash)
    }

    companion object {
        private const val RAW_TOKEN_BYTES = 32
        private const val HASH_ALGORITHM = "SHA-256"
    }
}
