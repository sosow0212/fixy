package com.fixy.house.agent.application.dto.response

import io.swagger.v3.oas.annotations.media.Schema

data class AgentKeyResponse(
    @Schema(description = "에이전트 정보") val agent: AgentSummaryResponse,
    @Schema(description = "에이전트 키 평문 (생성/회전 시점에만 노출, 이후 조회 불가)") val agentKey: String
)
