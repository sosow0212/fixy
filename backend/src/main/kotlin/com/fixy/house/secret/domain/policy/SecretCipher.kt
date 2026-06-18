package com.fixy.house.secret.domain.policy

import com.fixy.house.secret.domain.vo.SecretScope

interface SecretCipher {

    data class EncryptedPayload(
        val ciphertext: ByteArray,
        val iv: ByteArray,
        val tag: ByteArray
    ) {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other !is EncryptedPayload) return false
            return ciphertext.contentEquals(other.ciphertext) &&
                iv.contentEquals(other.iv) &&
                tag.contentEquals(other.tag)
        }

        override fun hashCode(): Int =
            ciphertext.contentHashCode() * 31 + iv.contentHashCode() * 31 + tag.contentHashCode()
    }

    fun encrypt(plaintext: String, additionalAuthenticationData: String): EncryptedPayload

    fun decrypt(
        ciphertext: ByteArray,
        iv: ByteArray,
        tag: ByteArray,
        additionalAuthenticationData: String
    ): String
}

interface SecretAadBuilder {
    fun build(ownerUserId: String, secretKey: String, scope: SecretScope): String
}
