package com.fixy.house.agent.ui

import com.fixy.house.agent.application.dto.request.CreateAgentRequest
import com.fixy.house.agent.application.dto.request.UpdateAgentRequest
import com.fixy.house.agent.application.dto.response.AgentKeyResponse
import com.fixy.house.agent.application.dto.response.AgentSummaryResponse
import com.fixy.house.agent.application.service.AgentService
import com.fixy.house.global.security.AuthUser
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Agents", description = "픽시 에이전트 관리")
@RestController
class AgentApi(private val agentService: AgentService) {

    @Operation(summary = "팀 에이전트 목록")
    @GetMapping("/api/v1/teams/{teamId}/agents")
    fun listAgents(
        @AuthUser userId: String,
        @PathVariable teamId: String
    ): ResponseEntity<List<AgentSummaryResponse>> =
        ResponseEntity.ok(agentService.listAgents(userId, teamId))

    @Operation(summary = "에이전트 생성 (MANAGER+) — 평문 키 1회 반환")
    @PostMapping("/api/v1/teams/{teamId}/agents")
    fun createAgent(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @Valid @RequestBody request: CreateAgentRequest
    ): ResponseEntity<AgentKeyResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(agentService.createAgent(userId, teamId, request))

    @Operation(summary = "에이전트 단건 조회")
    @GetMapping("/api/v1/agents/{agentId}")
    fun getAgent(
        @AuthUser userId: String,
        @PathVariable agentId: String
    ): ResponseEntity<AgentSummaryResponse> =
        ResponseEntity.ok(agentService.getAgent(userId, agentId))

    @Operation(summary = "에이전트 키 회전 (MANAGER+) — 새 평문 키 1회 반환")
    @PostMapping("/api/v1/agents/{agentId}/rotate-key")
    fun rotateKey(
        @AuthUser userId: String,
        @PathVariable agentId: String
    ): ResponseEntity<AgentKeyResponse> =
        ResponseEntity.ok(agentService.rotateKey(userId, agentId))

    @Operation(summary = "에이전트 정보 수정 (MANAGER+)")
    @PatchMapping("/api/v1/agents/{agentId}")
    fun updateAgent(
        @AuthUser userId: String,
        @PathVariable agentId: String,
        @Valid @RequestBody request: UpdateAgentRequest
    ): ResponseEntity<AgentSummaryResponse> =
        ResponseEntity.ok(agentService.updateAgent(userId, agentId, request))

    @Operation(summary = "에이전트 삭제 (OWNER)")
    @DeleteMapping("/api/v1/agents/{agentId}")
    fun deleteAgent(
        @AuthUser userId: String,
        @PathVariable agentId: String
    ): ResponseEntity<Void> {
        agentService.deleteAgent(userId, agentId)
        return ResponseEntity.noContent().build()
    }
}
