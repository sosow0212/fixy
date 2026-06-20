package com.fixy.house.secret.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.secret.application.dto.request.CreateSecretRequest
import com.fixy.house.secret.application.dto.request.UpdateSecretRequest
import com.fixy.house.secret.application.dto.response.RevealSecretResponse
import com.fixy.house.secret.application.dto.response.SecretSummaryResponse
import com.fixy.house.secret.domain.Secret
import com.fixy.house.secret.domain.SecretRepository
import com.fixy.house.secret.domain.exception.SecretExceptionType
import com.fixy.house.secret.domain.policy.SecretAadBuilder
import com.fixy.house.secret.domain.policy.SecretCipher
import com.fixy.house.secret.domain.vo.SecretScope
import com.fixy.house.team.domain.TeamMemberRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.Base64

@Service
class SecretService(
    private val secretRepository: SecretRepository,
    private val secretCipher: SecretCipher,
    private val secretAadBuilder: SecretAadBuilder,
    private val teamMemberRepository: TeamMemberRepository
) {

    private val log = LoggerFactory.getLogger(this::class.java)

    @Transactional
    fun create(actorUserId: String, request: CreateSecretRequest): SecretSummaryResponse {
        if (request.scope == SecretScope.TEAM) {
            val teamId = request.teamId
            if (teamId.isNullOrBlank()) {
                throw CustomException(SecretExceptionType.SECRET_FORBIDDEN, "TEAM 스코프는 teamId 가 필요합니다.")
            }
            if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, actorUserId)) {
                throw CustomException(SecretExceptionType.SECRET_FORBIDDEN, "해당 팀의 멤버만 TEAM 시크릿을 만들 수 있어요.")
            }
        }

        if (secretRepository.findByOwnerUserIdAndSecretKeyAndScope(
                actorUserId, request.key, request.scope
            ) != null
        ) {
            throw CustomException(SecretExceptionType.SECRET_KEY_DUPLICATE)
        }

        val aad = secretAadBuilder.build(actorUserId, request.key, request.scope)
        val payload = secretCipher.encrypt(request.value, aad)
        val secret = Secret.create(
            ownerUserId = actorUserId,
            secretKey = request.key,
            encryptedValue = encode(payload.ciphertext),
            iv = encode(payload.iv),
            authTag = encode(payload.tag),
            scope = request.scope,
            teamId = request.teamId?.takeIf { request.scope == SecretScope.TEAM },
            description = request.description
        )
        return SecretSummaryResponse.from(secretRepository.save(secret))
    }

    @Transactional(readOnly = true)
    fun listMine(actorUserId: String, teamId: String?): List<SecretSummaryResponse> {
        val personal = secretRepository.findAllByOwnerUserId(actorUserId)
        val team = if (!teamId.isNullOrBlank()) {
            if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, actorUserId)) {
                throw CustomException(SecretExceptionType.SECRET_FORBIDDEN, "해당 팀의 멤버만 팀 시크릿을 조회할 수 있어요.")
            }
            secretRepository.findAllByTeamId(teamId)
                .filter { it.ownerUserId == actorUserId || it.scope == SecretScope.TEAM }
        } else {
            emptyList()
        }
        val merged = (personal + team)
            .distinctBy { Triple(it.id, it.secretKey, it.scope) }
            .sortedByDescending { it.createdAt }
        return merged.map { SecretSummaryResponse.from(it) }
    }

    @Transactional
    fun update(
        actorUserId: String,
        secretId: String,
        request: UpdateSecretRequest
    ): SecretSummaryResponse {
        val secret = findAccessible(actorUserId, secretId)
        if (secret.ownerUserId != actorUserId) {
            throw CustomException(SecretExceptionType.SECRET_FORBIDDEN, "시크릿을 수정할 권한이 없습니다.")
        }

        if (request.value != null) {
            val aad = secretAadBuilder.build(actorUserId, secret.secretKey, secret.scope)
            val payload = secretCipher.encrypt(request.value, aad)
            secret.updateEncrypted(
                encryptedValue = encode(payload.ciphertext),
                iv = encode(payload.iv),
                authTag = encode(payload.tag)
            )
        }
        if (request.description != null) secret.updateDescription(request.description)
        return SecretSummaryResponse.from(secretRepository.save(secret))
    }

    @Transactional
    fun delete(actorUserId: String, secretId: String) {
        val secret = findAccessible(actorUserId, secretId)
        if (secret.ownerUserId != actorUserId) {
            throw CustomException(SecretExceptionType.SECRET_FORBIDDEN, "시크릿을 삭제할 권한이 없습니다.")
        }
        secretRepository.delete(secret)
    }

    @Transactional
    fun reveal(actorUserId: String, secretId: String): RevealSecretResponse {
        val secret = findAccessible(actorUserId, secretId)
        val aad = secretAadBuilder.build(secret.ownerUserId, secret.secretKey, secret.scope)
        val plaintext = secretCipher.decrypt(
            ciphertext = decode(secret.encryptedValue),
            iv = decode(secret.iv),
            tag = decode(secret.authTag),
            additionalAuthenticationData = aad
        )
        secret.markUsed()
        secretRepository.save(secret)
        log.warn(
            "[SECRET REVEAL] actorUserId={}, ownerUserId={}, secretId={}, key={}, scope={}, teamId={}",
            actorUserId, secret.ownerUserId, secret.id, secret.secretKey, secret.scope, secret.teamId
        )
        return RevealSecretResponse(
            id = secret.id.orEmpty(),
            key = secret.secretKey,
            scope = secret.scope,
            plaintext = plaintext
        )
    }

    @Transactional(readOnly = true)
    fun findAccessible(actorUserId: String, secretId: String): Secret {
        val secret = secretRepository.findById(secretId)
            ?: throw CustomException(SecretExceptionType.SECRET_NOT_FOUND)
        return when (secret.scope) {
            SecretScope.PERSONAL -> {
                if (secret.ownerUserId == actorUserId) secret
                else throw CustomException(SecretExceptionType.SECRET_FORBIDDEN)
            }

            SecretScope.TEAM -> {
                if (secret.ownerUserId == actorUserId) return secret
                val teamId = secret.teamId
                    ?: throw CustomException(SecretExceptionType.SECRET_FORBIDDEN, "TEAM 시크릿의 teamId 가 비어 있습니다.")
                if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, actorUserId)) {
                    throw CustomException(SecretExceptionType.SECRET_FORBIDDEN, "해당 팀의 멤버만 TEAM 시크릿을 조회할 수 있어요.")
                }
                secret
            }
        }
    }

    private fun encode(bytes: ByteArray): String = Base64.getEncoder().encodeToString(bytes)
    private fun decode(value: String): ByteArray = Base64.getDecoder().decode(value)
}
