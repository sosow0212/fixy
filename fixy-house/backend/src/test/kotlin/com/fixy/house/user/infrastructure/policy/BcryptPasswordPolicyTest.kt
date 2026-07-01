package com.fixy.house.user.infrastructure.policy

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldStartWith
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

class BcryptPasswordPolicyTest : DescribeSpec({

    val encoder: PasswordEncoder = BCryptPasswordEncoder(4) // 테스트에서는 strength 낮춤

    describe("BcryptPasswordHasher") {
        it("encode 결과는 $2a$ 로 시작한다") {
            val hasher = BcryptPasswordHasher(encoder)
            hasher.hash("hello-world-1234") shouldStartWith "\$2a\$"
        }

        it("같은 평문이라도 해시는 매번 다르다 (salt)") {
            val hasher = BcryptPasswordHasher(encoder)
            val a = hasher.hash("hello-world-1234")
            val b = hasher.hash("hello-world-1234")
            (a == b) shouldBe false
        }
    }

    describe("BcryptPasswordVerifier") {
        it("맞는 평문이 true") {
            val hasher = BcryptPasswordHasher(encoder)
            val verifier = BcryptPasswordVerifier(encoder)
            val hashed = hasher.hash("hello-world-1234")
            verifier.matches("hello-world-1234", hashed) shouldBe true
        }

        it("틀린 평문이 false") {
            val hasher = BcryptPasswordHasher(encoder)
            val verifier = BcryptPasswordVerifier(encoder)
            val hashed = hasher.hash("hello-world-1234")
            verifier.matches("wrong-password", hashed) shouldBe false
        }
    }
})
