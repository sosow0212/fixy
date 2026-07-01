package com.fixy.house.session.application.dto.request

import com.fixy.house.session.domain.vo.ToolCallStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant

data class AppendToolCallRequest(
    @field:Schema(description = "에이전트가 발급한 툴콜 ID (멱등키)", example = "tc_abc123")
    @field:NotBlank
    val clientToolCallId: String,

    @field:Schema(description = "연결된 어시스턴트 메시지 ID")
    val messageId: String? = null,

    @field:Schema(description = "툴 이름", example = "read")
    @field:NotBlank
    val toolName: String,

    @field:Schema(description = "툴 인자 (JSON 직렬화 문자열)")
    @field:NotBlank
    val argsJson: String,

    @field:Schema(description = "초기 상태 (보통 PENDING)")
    @field:NotNull
    val status: ToolCallStatus,

    @field:Schema(description = "시작 시각")
    @field:NotNull
    val startedAt: Instant
)
