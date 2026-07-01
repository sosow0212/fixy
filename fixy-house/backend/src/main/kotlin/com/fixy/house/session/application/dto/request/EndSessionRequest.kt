package com.fixy.house.session.application.dto.request

import com.fixy.house.session.domain.vo.SessionStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotNull
import java.time.Instant

data class EndSessionRequest(
    @field:Schema(description = "종료 상태 (COMPLETED / FAILED)")
    @field:NotNull
    val status: SessionStatus,

    @field:Schema(description = "종료 시각 (없으면 서버 시각)")
    val endedAt: Instant? = null,

    @field:Schema(description = "세션 요약")
    val summary: String? = null
)
