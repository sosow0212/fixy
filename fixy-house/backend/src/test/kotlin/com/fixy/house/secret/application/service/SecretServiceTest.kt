package com.fixy.house.secret.application.service

import com.fixy.house.secret.application.dto.request.CreateSecretRequest
import com.fixy.house.secret.application.dto.request.UpdateSecretRequest
import com.fixy.house.secret.domain.Secret
import com.fixy.house.secret.domain.SecretRepository
import com.fixy.house.secret.domain.exception.SecretExceptionType
import com.fixy.house.secret.domain.policy.SecretAadBuilder
import com.fixy.house.secret.domain.policy.SecretCipher
import com.fixy.house.secret.domain.vo.SecretScope
import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.team.domain.TeamMemberRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify

class SecretServiceTest : DescribeSpec({

    val secretRepository = mockk<SecretRepository>(relaxed = true)
    val secretCipher = mockk<SecretCipher>(relaxed = true)
    val secretAadBuilder = mockk<SecretAadBuilder>()
    val teamMemberRepository = mockk<TeamMemberRepository>(relaxed = true)
    val service = SecretService(secretRepository, secretCipher, secretAadBuilder, teamMemberRepository)

    fun stubSecret(
        id: String = "s-1",
        owner: String = "owner-1",
        key: String = "OPENAI_API_KEY",
        scope: SecretScope = SecretScope.PERSONAL,
        teamId: String? = null
    ): Secret {
        val s = Secret.create(
            ownerUserId = owner,
            secretKey = key,
            encryptedValue = "ct",
            iv = "iv",
            authTag = "tag",
            scope = scope,
            teamId = teamId,
            description = "desc"
        )
        s.id = id
        return s
    }

    val dummyPayload = SecretCipher.EncryptedPayload(
        ciphertext = byteArrayOf(1, 2, 3),
        iv = byteArrayOf(4, 5, 6),
        tag = byteArrayOf(7, 8, 9)
    )

    beforeEach {
        clearMocks(secretRepository, secretCipher, secretAadBuilder, teamMemberRepository)
    }

    describe("create") {
        it("PERSONAL scope 정상") {
            every { secretRepository.findByOwnerUserIdAndSecretKeyAndScope("actor", "DB_PWD", SecretScope.PERSONAL) } returns null
            every { secretAadBuilder.build("actor", "DB_PWD", SecretScope.PERSONAL) } returns "aad"
            every { secretCipher.encrypt("hunter2", "aad") } returns dummyPayload
            every { secretRepository.save(any()) } answers { firstArg() }

            val response = service.create(
                actorUserId = "actor",
                request = CreateSecretRequest(key = "DB_PWD", value = "hunter2", scope = SecretScope.PERSONAL)
            )
            response.key shouldBe "DB_PWD"
            response.scope shouldBe SecretScope.PERSONAL
        }

        it("TEAM scope + teamId 누락이면 FORBIDDEN") {
            val ex = shouldThrow<CustomException> {
                service.create("actor", CreateSecretRequest(key = "K", value = "v", scope = SecretScope.TEAM, teamId = null))
            }
            ex.getExceptionType() shouldBe SecretExceptionType.SECRET_FORBIDDEN
        }

        it("TEAM scope + 비멤버면 FORBIDDEN") {
            every { teamMemberRepository.existsByTeamIdAndUserId("t1", "actor") } returns false
            val ex = shouldThrow<CustomException> {
                service.create("actor", CreateSecretRequest(key = "K", value = "v", scope = SecretScope.TEAM, teamId = "t1"))
            }
            ex.getExceptionType() shouldBe SecretExceptionType.SECRET_FORBIDDEN
        }

        it("중복 (owner, key, scope) 면 SECRET_KEY_DUPLICATE") {
            every { secretRepository.findByOwnerUserIdAndSecretKeyAndScope("actor", "DB_PWD", SecretScope.PERSONAL) } returns
                stubSecret()
            val ex = shouldThrow<CustomException> {
                service.create("actor", CreateSecretRequest(key = "DB_PWD", value = "v", scope = SecretScope.PERSONAL))
            }
            ex.getExceptionType() shouldBe SecretExceptionType.SECRET_KEY_DUPLICATE
        }
    }

    describe("update") {
        it("소유자는 value 변경 시 재암호화") {
            val secret = stubSecret(owner = "actor")
            every { secretRepository.findById("s-1") } returns secret
            every { secretAadBuilder.build("actor", "OPENAI_API_KEY", SecretScope.PERSONAL) } returns "aad"
            every { secretCipher.encrypt("new-value", "aad") } returns dummyPayload
            every { secretRepository.save(any()) } answers { firstArg() }

            val response = service.update(
                actorUserId = "actor",
                secretId = "s-1",
                request = UpdateSecretRequest(value = "new-value", description = "updated")
            )
            response.description shouldBe "updated"
            verify(exactly = 1) { secretCipher.encrypt("new-value", "aad") }
        }

        it("소유자가 아니면 FORBIDDEN") {
            val secret = stubSecret(owner = "other")
            every { secretRepository.findById("s-1") } returns secret
            val ex = shouldThrow<CustomException> {
                service.update("actor", "s-1", UpdateSecretRequest(value = "v"))
            }
            ex.getExceptionType() shouldBe SecretExceptionType.SECRET_FORBIDDEN
        }
    }

    describe("reveal") {
        it("소유자가 평문 조회 시 markUsed + audit") {
            val secret = stubSecret(owner = "actor")
            every { secretRepository.findById("s-1") } returns secret
            every { secretAadBuilder.build("actor", "OPENAI_API_KEY", SecretScope.PERSONAL) } returns "aad"
            every { secretCipher.decrypt(any(), any(), any(), any()) } returns "plaintext"
            every { secretRepository.save(any()) } answers { firstArg() }

            val response = service.reveal("actor", "s-1")
            response.plaintext shouldBe "plaintext"
            secret.lastUsedAt shouldNotBe null
            verify { secretRepository.save(secret) }
        }

        it("존재하지 않으면 SECRET_NOT_FOUND") {
            every { secretRepository.findById("nope") } returns null
            val ex = shouldThrow<CustomException> { service.reveal("actor", "nope") }
            ex.getExceptionType() shouldBe SecretExceptionType.SECRET_NOT_FOUND
        }
    }

    describe("listMine") {
        it("PERSONAL 시크릿만 반환") {
            val mine = stubSecret(owner = "actor", key = "DB_PWD")
            every { secretRepository.findAllByOwnerUserId("actor") } returns listOf(mine)
            every { secretRepository.findAllByTeamId(any()) } returns emptyList()

            val response = service.listMine("actor", teamId = null)
            response.size shouldBe 1
            response.first().key shouldBe "DB_PWD"
        }

        it("TEAM 조회 시 비멤버면 FORBIDDEN") {
            every { teamMemberRepository.existsByTeamIdAndUserId("t1", "actor") } returns false
            val ex = shouldThrow<CustomException> { service.listMine("actor", teamId = "t1") }
            ex.getExceptionType() shouldBe SecretExceptionType.SECRET_FORBIDDEN
        }
    }
})
