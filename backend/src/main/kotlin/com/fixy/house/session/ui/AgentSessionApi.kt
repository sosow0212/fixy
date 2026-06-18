package com.fixy.house.session.ui

import com.fixy.house.global.security.AgentId
import com.fixy.house.session.application.dto.request.AppendEpisodeRequest
import com.fixy.house.session.application.dto.request.AppendMessageRequest
import com.fixy.house.session.application.dto.request.AppendToolCallRequest
import com.fixy.house.session.application.dto.request.EndSessionRequest
import com.fixy.house.session.application.dto.request.FinishToolCallRequest
import com.fixy.house.session.application.dto.request.StartSessionRequest
import com.fixy.house.session.application.dto.response.EpisodeResponse
import com.fixy.house.session.application.dto.response.MessageResponse
import com.fixy.house.session.application.dto.response.SessionSummaryResponse
import com.fixy.house.session.application.dto.response.ToolCallResponse
import com.fixy.house.session.application.service.SessionService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Agent Ingress", description = "fixy-agent 가 직접 호출 (X-Fixy-Agent-Key 인증)")
@RestController
@RequestMapping("/api/v1/agent/sessions")
class AgentSessionApi(private val sessionService: SessionService) {

    @Operation(summary = "세션 시작/재개 (멱등: (agentId, sessionIdFromAgent) 기준)")
    @PostMapping
    fun start(
        @AgentId agentId: String,
        @Valid @RequestBody request: StartSessionRequest
    ): ResponseEntity<SessionSummaryResponse> =
        ResponseEntity
            .status(HttpStatus.CREATED)
            .body(sessionService.startSessionByAgent(agentId, request))

    @Operation(summary = "세션 종료 (status=COMPLETED/FAILED)")
    @PatchMapping("/{sessionIdFromAgent}")
    fun end(
        @AgentId agentId: String,
        @PathVariable sessionIdFromAgent: String,
        @Valid @RequestBody request: EndSessionRequest
    ): ResponseEntity<SessionSummaryResponse> =
        ResponseEntity.ok(sessionService.endSessionByAgent(agentId, sessionIdFromAgent, request))

    @Operation(summary = "메시지 추가 (멱등: (sessionId, sequence))")
    @PostMapping("/{sessionIdFromAgent}/messages")
    fun appendMessage(
        @AgentId agentId: String,
        @PathVariable sessionIdFromAgent: String,
        @Valid @RequestBody request: AppendMessageRequest
    ): ResponseEntity<MessageResponse> =
        ResponseEntity
            .status(HttpStatus.CREATED)
            .body(sessionService.appendMessageByAgent(agentId, sessionIdFromAgent, request))

    @Operation(summary = "툴 호출 시작")
    @PostMapping("/{sessionIdFromAgent}/tool-calls")
    fun appendToolCall(
        @AgentId agentId: String,
        @PathVariable sessionIdFromAgent: String,
        @Valid @RequestBody request: AppendToolCallRequest
    ): ResponseEntity<ToolCallResponse> =
        ResponseEntity
            .status(HttpStatus.CREATED)
            .body(sessionService.appendToolCallByAgent(agentId, sessionIdFromAgent, request))

    @Operation(summary = "툴 호출 종료")
    @PatchMapping("/{sessionIdFromAgent}/tool-calls/{toolCallId}")
    fun finishToolCall(
        @AgentId agentId: String,
        @PathVariable sessionIdFromAgent: String,
        @PathVariable toolCallId: String,
        @Valid @RequestBody request: FinishToolCallRequest
    ): ResponseEntity<ToolCallResponse> =
        ResponseEntity.ok(sessionService.finishToolCallByAgent(agentId, sessionIdFromAgent, toolCallId, request))

    @Operation(summary = "L1 에피소드 추가 (멱등: (agentId, episodeId))")
    @PostMapping("/{sessionIdFromAgent}/episodes")
    fun appendEpisode(
        @AgentId agentId: String,
        @PathVariable sessionIdFromAgent: String,
        @Valid @RequestBody request: AppendEpisodeRequest
    ): ResponseEntity<EpisodeResponse> =
        ResponseEntity
            .status(HttpStatus.CREATED)
            .body(sessionService.appendEpisodeByAgent(agentId, sessionIdFromAgent, request))
}
