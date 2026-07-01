package com.fixy.house.session.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import java.time.Instant

data class StartSessionRequest(
    @field:Schema(description = "fixy-agent 가 발급한 세션 ID (예: ses_xxx)")
    @field:NotBlank
    val sessionIdFromAgent: String,

    @field:Schema(description = "소속 팀 ID")
    @field:NotBlank
    val teamId: String,

    @field:Schema(description = "에이전트를 실행한 사용자 (있다면)")
    val userIdOnAgent: String? = null,

    @field:Schema(description = "작업 디렉토리/프로젝트 이름")
    val projectName: String? = null,

    @field:Schema(description = "세션 시작 시각 (없으면 서버 시각)")
    val startedAt: Instant? = null
)
