package com.fixy.house.session.application.dto.response

import com.fixy.house.session.domain.Episode
import com.fixy.house.session.domain.vo.Signal
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class EpisodeResponse(
    @Schema(description = "에피소드 ID (Mongo)") val id: String,
    @Schema(description = "에이전트 발급 ID") val episodeId: String,
    @Schema(description = "세션 ID") val sessionId: String,
    @Schema(description = "에이전트 ID") val agentId: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "시각") val ts: Instant,
    @Schema(description = "시그널") val signal: Signal,
    @Schema(description = "요약") val summary: String,
    @Schema(description = "태그") val tags: List<String>,
    @Schema(description = "만진 파일") val files: List<String>,
    @Schema(description = "프로젝트 이름") val projectName: String?,
    @Schema(description = "승급된 스킬") val promotedTo: String?
) {
    companion object {
        fun from(domain: Episode): EpisodeResponse = EpisodeResponse(
            id = domain.id.orEmpty(),
            episodeId = domain.episodeId,
            sessionId = domain.sessionId,
            agentId = domain.agentId,
            teamId = domain.teamId,
            ts = domain.ts,
            signal = domain.signal,
            summary = domain.summary,
            tags = domain.tags,
            files = domain.files,
            projectName = domain.projectName,
            promotedTo = domain.promotedTo
        )
    }
}
