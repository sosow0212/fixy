package com.fixy.house.secret.infrastructure.policy

import com.fixy.house.secret.domain.exception.SecretExceptionType
import com.fixy.house.secret.domain.policy.SecretCipher
import com.fixy.house.global.exceptions.CustomException
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

@Component
class AesGcmSecretCipher(
    @Value("\${app.security.master-key}")
    private val masterKeyBase64: String
) : SecretCipher {

    companion object {
        private const val ALGORITHM = "AES/GCM/NoPadding"
        private const val KEY_ALGORITHM = "AES"
        private const val IV_LENGTH_BYTES = 12
        private const val GCM_TAG_LENGTH_BITS = 128
        private const val REQUIRED_KEY_BYTES = 32
    }

    private val keyBytes: ByteArray = decodeAndValidateKey(masterKeyBase64)
    private val keySpec: SecretKeySpec = SecretKeySpec(keyBytes, KEY_ALGORITHM)
    private val secureRandom = SecureRandom()

    override fun encrypt(plaintext: String, additionalAuthenticationData: String): SecretCipher.EncryptedPayload {
        val iv = ByteArray(IV_LENGTH_BYTES).also(secureRandom::nextBytes)
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv))
        cipher.updateAAD(additionalAuthenticationData.toByteArray(Charsets.UTF_8))
        val cipherOutput = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
        val tagLength = GCM_TAG_LENGTH_BITS / 8
        val tagStart = cipherOutput.size - tagLength
        val ciphertext = cipherOutput.copyOfRange(0, tagStart)
        val tag = cipherOutput.copyOfRange(tagStart, cipherOutput.size)
        return SecretCipher.EncryptedPayload(ciphertext = ciphertext, iv = iv, tag = tag)
    }

    override fun decrypt(
        ciphertext: ByteArray,
        iv: ByteArray,
        tag: ByteArray,
        additionalAuthenticationData: String
    ): String {
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.DECRYPT_MODE, keySpec, GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv))
        cipher.updateAAD(additionalAuthenticationData.toByteArray(Charsets.UTF_8))
        val plainBytes = try {
            cipher.doFinal(ciphertext + tag)
        } catch (e: javax.crypto.AEADBadTagException) {
            throw CustomException(SecretExceptionType.DECRYPTION_FAILED, "GCM tag verification failed")
        } catch (e: javax.crypto.BadPaddingException) {
            throw CustomException(SecretExceptionType.DECRYPTION_FAILED, "Bad padding")
        } catch (e: javax.crypto.IllegalBlockSizeException) {
            throw CustomException(SecretExceptionType.DECRYPTION_FAILED, "Illegal block size")
        }
        return String(plainBytes, Charsets.UTF_8)
    }

    private fun decodeAndValidateKey(base64Key: String): ByteArray {
        val bytes = try {
            Base64.getDecoder().decode(base64Key)
        } catch (e: IllegalArgumentException) {
            throw IllegalStateException(
                "app.security.master-key 는 Base64 인코딩된 ${REQUIRED_KEY_BYTES}바이트 키여야 합니다.",
                e
            )
        }
        if (bytes.size != REQUIRED_KEY_BYTES) {
            throw IllegalStateException(
                "app.security.master-key 길이는 ${REQUIRED_KEY_BYTES}바이트여야 합니다 (현재 ${bytes.size}바이트)."
            )
        }
        return bytes
    }

    fun base64Encode(bytes: ByteArray): String = Base64.getEncoder().encodeToString(bytes)
    fun base64Decode(value: String): ByteArray = Base64.getDecoder().decode(value)
}
