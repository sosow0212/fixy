package com.fixy.house.session.application.dto.request

import com.fixy.house.session.domain.vo.ToolCallStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotNull
import java.time.Instant

data class FinishToolCallRequest(
    @field:Schema(description = "최종 상태 (SUCCESS / FAILED)")
    @field:NotNull
    val status: ToolCallStatus,

    @field:Schema(description = "결과 (JSON 직렬화 문자열)")
    val resultJson: String? = null,

    @field:Schema(description = "에러 메시지 (FAILED 일 때)")
    val errorMessage: String? = null,

    @field:Schema(description = "종료 시각 (없으면 서버 시각)")
    val finishedAt: Instant? = null
)
