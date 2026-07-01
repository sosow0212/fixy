package com.fixy.house.secret.domain

import com.fixy.house.secret.domain.vo.SecretScope
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe

class SecretTest : DescribeSpec({

    fun newSecret(
        owner: String = "u1",
        key: String = "OPENAI_API_KEY",
        scope: SecretScope = SecretScope.PERSONAL,
        teamId: String? = null
    ): Secret = Secret.create(
        ownerUserId = owner,
        secretKey = key,
        encryptedValue = "ct",
        iv = "iv",
        authTag = "tag",
        scope = scope,
        teamId = teamId,
        description = null
    )

    describe("Secret.create - secretKey pattern") {
        it("UPPERCASE + 숫자 + _ : 통과") {
            val s = newSecret(key = "AWS_ACCESS_KEY_ID")
            s.secretKey shouldBe "AWS_ACCESS_KEY_ID"
        }

        it("소문자 포함이면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> { newSecret(key = "lowercase") }
        }

        it("하이픈이면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> { newSecret(key = "WITH-DASH") }
        }

        it("공백이면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> { newSecret(key = "WITH SPACE") }
        }

        it("1자 이하면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> { newSecret(key = "A") }
        }

        it("65자 이상이면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> { newSecret(key = "A".repeat(65)) }
        }
    }

    describe("Secret.create - scope/teamId") {
        it("TEAM 스코프 + teamId 누락이면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> { newSecret(scope = SecretScope.TEAM, teamId = null) }
        }

        it("TEAM 스코프 + teamId 정상") {
            val s = newSecret(scope = SecretScope.TEAM, teamId = "team-1")
            s.teamId shouldBe "team-1"
        }
    }

    describe("Secret.updateEncrypted") {
        it("정상 갱신") {
            val s = newSecret()
            s.updateEncrypted("ct2", "iv2", "tag2")
            s.encryptedValue shouldBe "ct2"
            s.iv shouldBe "iv2"
            s.authTag shouldBe "tag2"
        }

        it("빈 iv 면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> { newSecret().updateEncrypted("c", " ", "t") }
        }
    }

    describe("Secret.markUsed") {
        it("lastUsedAt 이 갱신된다") {
            val s = newSecret()
            s.lastUsedAt shouldBe null
            s.markUsed()
            s.lastUsedAt shouldNotBe null
        }
    }
})
