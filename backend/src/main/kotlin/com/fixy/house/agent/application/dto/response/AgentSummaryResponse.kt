package com.fixy.house.agent.application.dto.response

import com.fixy.house.agent.domain.Agent
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class AgentSummaryResponse(
    @Schema(description = "에이전트 ID") val id: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "에이전트 이름") val name: String,
    @Schema(description = "상태 (ACTIVE / DISABLED)") val status: String,
    @Schema(description = "에이전트 키 마지막 4자리") val agentKeyLastFour: String,
    @Schema(description = "마지막 연결 시각") val lastConnectedAt: Instant?,
    @Schema(description = "생성자 사용자 ID") val createdByUserId: String,
    @Schema(description = "생성 시각") val createdAt: Instant?
) {
    companion object {
        fun from(agent: Agent): AgentSummaryResponse = AgentSummaryResponse(
            id = agent.id.orEmpty(),
            teamId = agent.teamId,
            name = agent.name,
            status = agent.status.name,
            agentKeyLastFour = agent.agentKeyLastFour,
            lastConnectedAt = agent.lastConnectedAt,
            createdByUserId = agent.createdByUserId,
            createdAt = agent.createdAt
        )
    }
}
