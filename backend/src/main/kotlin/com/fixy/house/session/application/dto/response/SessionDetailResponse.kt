package com.fixy.house.session.application.dto.response

import io.swagger.v3.oas.annotations.media.Schema

data class SessionDetailResponse(
    @Schema(description = "세션 메타") val session: SessionSummaryResponse,
    @Schema(description = "메시지 목록") val messages: List<MessageResponse>,
    @Schema(description = "툴콜 목록") val toolCalls: List<ToolCallResponse>,
    @Schema(description = "에피소드 목록") val episodes: List<EpisodeResponse>
)
