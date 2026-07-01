package com.fixy.house.invitation.ui

import com.fixy.house.global.security.AuthUser
import com.fixy.house.invitation.application.dto.request.AcceptInvitationRequest
import com.fixy.house.invitation.application.dto.request.InviteMemberRequest
import com.fixy.house.invitation.application.dto.response.AcceptInvitationResponse
import com.fixy.house.invitation.application.dto.response.InvitationResponse
import com.fixy.house.invitation.application.service.InvitationService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Invitations", description = "팀원 초대")
@RestController
class InvitationApi(private val invitationService: InvitationService) {

    @Operation(summary = "팀 멤버 초대 (MANAGER+)")
    @PostMapping("/api/v1/teams/{teamId}/invitations")
    fun create(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @Valid @RequestBody request: InviteMemberRequest
    ): ResponseEntity<InvitationResponse> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(invitationService.createInvitation(userId, teamId, request))

    @Operation(summary = "팀 초대 목록")
    @GetMapping("/api/v1/teams/{teamId}/invitations")
    fun list(
        @AuthUser userId: String,
        @PathVariable teamId: String
    ): ResponseEntity<List<InvitationResponse>> =
        ResponseEntity.ok(invitationService.listInvitations(userId, teamId))

    @Operation(summary = "초대 취소 (MANAGER+)")
    @DeleteMapping("/api/v1/teams/{teamId}/invitations/{invitationId}")
    fun revoke(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable invitationId: String
    ): ResponseEntity<Void> {
        invitationService.revoke(userId, teamId, invitationId)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "초대 수락 (공개 — 토큰 기반 자동 가입/로그인)")
    @PostMapping("/api/v1/invitations/accept")
    fun accept(
        @Valid @RequestBody request: AcceptInvitationRequest
    ): ResponseEntity<AcceptInvitationResponse> =
        ResponseEntity.ok(invitationService.acceptInvitation(request))
}
