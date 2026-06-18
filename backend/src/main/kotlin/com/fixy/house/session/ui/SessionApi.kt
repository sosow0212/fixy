package com.fixy.house.session.ui

import com.fixy.house.global.security.AuthUser
import com.fixy.house.session.application.dto.request.UpdateSessionRequest
import com.fixy.house.session.application.dto.response.SessionDetailResponse
import com.fixy.house.session.application.dto.response.SessionSummaryResponse
import com.fixy.house.session.application.service.SessionService
import com.fixy.house.session.domain.vo.SessionStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Sessions", description = "팀 세션 조회/태깅/삭제")
@RestController
@RequestMapping("/api/v1")
class SessionApi(private val sessionService: SessionService) {

    @Operation(summary = "팀의 세션 목록")
    @GetMapping("/teams/{teamId}/sessions")
    fun listByTeam(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @RequestParam(required = false) statuses: List<SessionStatus>?,
        @RequestParam(required = false) projectName: String?,
        @RequestParam(defaultValue = "50") limit: Int
    ): ResponseEntity<List<SessionSummaryResponse>> =
        ResponseEntity.ok(sessionService.listByTeam(userId, teamId, statuses, projectName, limit))

    @Operation(summary = "세션 상세 (메시지/툴콜/에피소드 포함)")
    @GetMapping("/sessions/{sessionId}")
    fun getDetail(
        @AuthUser userId: String,
        @PathVariable sessionId: String
    ): ResponseEntity<SessionDetailResponse> =
        ResponseEntity.ok(sessionService.getDetail(userId, sessionId))

    @Operation(summary = "세션 메타 수정 (요약/태그)")
    @PatchMapping("/sessions/{sessionId}")
    fun updateMetadata(
        @AuthUser userId: String,
        @PathVariable sessionId: String,
        @Valid @RequestBody request: UpdateSessionRequest
    ): ResponseEntity<SessionSummaryResponse> =
        ResponseEntity.ok(sessionService.updateMetadata(userId, sessionId, request))

    @Operation(summary = "세션 삭제 (MANAGER+)")
    @DeleteMapping("/sessions/{sessionId}")
    fun delete(
        @AuthUser userId: String,
        @PathVariable sessionId: String
    ): ResponseEntity<Void> {
        sessionService.delete(userId, sessionId)
        return ResponseEntity.noContent().build()
    }
}
