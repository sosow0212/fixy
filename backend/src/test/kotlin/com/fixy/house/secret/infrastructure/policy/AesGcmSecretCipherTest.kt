package com.fixy.house.secret.infrastructure.policy

import com.fixy.house.global.exceptions.CustomException
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import java.util.Base64

class AesGcmSecretCipherTest : DescribeSpec({

    val validBase64Key = Base64.getEncoder().encodeToString(ByteArray(32) { it.toByte() })
    val aadBuilder = DefaultSecretAadBuilder()

    describe("construction") {
        it("32B Base64 키는 정상 생성") {
            AesGcmSecretCipher(validBase64Key)
        }

        it("16B 키면 IllegalStateException") {
            val shortKey = Base64.getEncoder().encodeToString(ByteArray(16) { it.toByte() })
            val ex = shouldThrow<IllegalStateException> { AesGcmSecretCipher(shortKey) }
            ex.message!!.contains("32") shouldBe true
        }

        it("잘못된 Base64 면 IllegalStateException") {
            shouldThrow<IllegalStateException> { AesGcmSecretCipher("not-base64!@#") }
        }
    }

    describe("round-trip") {
        it("encrypt → decrypt 시 평문 복원") {
            val cipher = AesGcmSecretCipher(validBase64Key)
            val aad = aadBuilder.build("u-1", "OPENAI_API_KEY", com.fixy.house.secret.domain.vo.SecretScope.PERSONAL)
            val payload = cipher.encrypt("sk-1234567890", aad)
            val plain = cipher.decrypt(payload.ciphertext, payload.iv, payload.tag, aad)
            plain shouldBe "sk-1234567890"
        }

        it("같은 평문이라도 매번 다른 ciphertext + iv") {
            val cipher = AesGcmSecretCipher(validBase64Key)
            val aad = "aad"
            val p1 = cipher.encrypt("hello", aad)
            val p2 = cipher.encrypt("hello", aad)
            (p1.ciphertext.contentEquals(p2.ciphertext)) shouldBe false
            (p1.iv.contentEquals(p2.iv)) shouldBe false
        }

        it("tag 는 16바이트") {
            val cipher = AesGcmSecretCipher(validBase64Key)
            val payload = cipher.encrypt("hello", "aad")
            payload.tag.size shouldBe 16
        }
    }

    describe("AAD binding") {
        it("다른 AAD 로 decrypt 하면 DECRYPTION_FAILED") {
            val cipher = AesGcmSecretCipher(validBase64Key)
            val payload = cipher.encrypt("secret-value", "aad-correct")
            val ex = shouldThrow<CustomException> {
                cipher.decrypt(payload.ciphertext, payload.iv, payload.tag, "aad-wrong")
            }
            ex.getExceptionType().errorCode shouldBe "DECRYPTION_FAILED"
        }
    }

    describe("base64 helpers") {
        it("encode/decode 왕복") {
            val cipher = AesGcmSecretCipher(validBase64Key)
            val src = "hello".toByteArray()
            val encoded = cipher.base64Encode(src)
            cipher.base64Decode(encoded).contentEquals(src) shouldBe true
        }
    }
})
