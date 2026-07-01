package com.fixy.house.session.application.dto.response

import com.fixy.house.session.domain.Session
import com.fixy.house.session.domain.vo.SessionStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class SessionSummaryResponse(
    @Schema(description = "세션 ID") val id: String,
    @Schema(description = "에이전트 ID") val agentId: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "에이전트 발급 ID") val sessionIdFromAgent: String,
    @Schema(description = "에이전트 실행자 userId") val userIdOnAgent: String?,
    @Schema(description = "프로젝트 이름") val projectName: String?,
    @Schema(description = "상태") val status: SessionStatus,
    @Schema(description = "시작 시각") val startedAt: Instant,
    @Schema(description = "종료 시각") val endedAt: Instant?,
    @Schema(description = "메시지 수") val messageCount: Int,
    @Schema(description = "툴콜 수") val toolCallCount: Int,
    @Schema(description = "에피소드 수") val episodeCount: Int,
    @Schema(description = "요약") val summary: String?,
    @Schema(description = "마지막 활동 시각") val lastActivityAt: Instant,
    @Schema(description = "태그") val tags: List<String>,
    @Schema(description = "생성 시각") val createdAt: Instant?,
    @Schema(description = "수정 시각") val updatedAt: Instant?
) {
    companion object {
        fun from(domain: Session): SessionSummaryResponse = SessionSummaryResponse(
            id = domain.id.orEmpty(),
            agentId = domain.agentId,
            teamId = domain.teamId,
            sessionIdFromAgent = domain.sessionIdFromAgent,
            userIdOnAgent = domain.userIdOnAgent,
            projectName = domain.projectName,
            status = domain.status,
            startedAt = domain.startedAt,
            endedAt = domain.endedAt,
            messageCount = domain.messageCount,
            toolCallCount = domain.toolCallCount,
            episodeCount = domain.episodeCount,
            summary = domain.summary,
            lastActivityAt = domain.lastActivityAt,
            tags = domain.tags,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt
        )
    }
}
