package com.fixy.house.secret.ui

import com.fixy.house.global.security.AuthUser
import com.fixy.house.secret.application.dto.request.CreateSecretRequest
import com.fixy.house.secret.application.dto.request.UpdateSecretRequest
import com.fixy.house.secret.application.dto.response.RevealSecretResponse
import com.fixy.house.secret.application.dto.response.SecretSummaryResponse
import com.fixy.house.secret.application.service.SecretService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Secrets", description = "개인/팀 시크릿 (AES-256-GCM 암호화)")
@RestController
@RequestMapping("/api/v1/secrets")
class SecretApi(private val secretService: SecretService) {

    @Operation(summary = "내 시크릿 목록 (teamId 지정 시 해당 팀 TEAM 시크릿 포함)")
    @GetMapping
    fun listSecrets(
        @AuthUser userId: String,
        @RequestParam(required = false) teamId: String?
    ): ResponseEntity<List<SecretSummaryResponse>> =
        ResponseEntity.ok(secretService.listMine(userId, teamId))

    @Operation(summary = "시크릿 생성")
    @PostMapping
    fun createSecret(
        @AuthUser userId: String,
        @Valid @RequestBody request: CreateSecretRequest
    ): ResponseEntity<SecretSummaryResponse> =
        ResponseEntity.ok(secretService.create(userId, request))

    @Operation(summary = "시크릿 수정 (value 변경 시 재암호화)")
    @PatchMapping("/{secretId}")
    fun updateSecret(
        @AuthUser userId: String,
        @PathVariable secretId: String,
        @Valid @RequestBody request: UpdateSecretRequest
    ): ResponseEntity<SecretSummaryResponse> =
        ResponseEntity.ok(secretService.update(userId, secretId, request))

    @Operation(summary = "시크릿 삭제")
    @DeleteMapping("/{secretId}")
    fun deleteSecret(
        @AuthUser userId: String,
        @PathVariable secretId: String
    ): ResponseEntity<Void> {
        secretService.delete(userId, secretId)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "시크릿 평문 조회 (감사 로그 기록)")
    @GetMapping("/{secretId}/reveal")
    fun revealSecret(
        @AuthUser userId: String,
        @PathVariable secretId: String
    ): ResponseEntity<RevealSecretResponse> =
        ResponseEntity.ok(secretService.reveal(userId, secretId))
}
