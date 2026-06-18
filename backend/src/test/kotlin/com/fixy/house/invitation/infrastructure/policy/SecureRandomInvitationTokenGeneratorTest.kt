package com.fixy.house.invitation.infrastructure.policy

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldMatch
import io.kotest.matchers.string.shouldStartWith

class SecureRandomInvitationTokenGeneratorTest : DescribeSpec({

    val generator = SecureRandomInvitationTokenGenerator()

    describe("generateRawToken") {
        it("Base64 URL-safe 형식이다") {
            val token = generator.generateRawToken()
            token shouldMatch Regex("^[A-Za-z0-9_-]+$")
        }

        it("32 바이트 raw → 43 문자 Base64 (without padding)") {
            val token = generator.generateRawToken()
            token.length shouldBe 43
        }

        it("호출할 때마다 다른 토큰이 생성된다") {
            val a = generator.generateRawToken()
            val b = generator.generateRawToken()
            (a == b) shouldBe false
        }
    }

    describe("hashToken") {
        it("같은 raw 토큰은 같은 해시를 반환한다") {
            val h1 = generator.hashToken("abc")
            val h2 = generator.hashToken("abc")
            h1 shouldBe h2
        }

        it("다른 raw 토큰은 다른 해시를 반환한다") {
            val h1 = generator.hashToken("abc")
            val h2 = generator.hashToken("def")
            (h1 == h2) shouldBe false
        }

        it("SHA-256 → 43 자 Base64 (without padding)") {
            val h = generator.hashToken("abc")
            h.length shouldBe 43
            h shouldStartWith ""
        }
    }
})
