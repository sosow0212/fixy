package com.fixy.house.session.application.dto.response

import com.fixy.house.session.domain.ToolCall
import com.fixy.house.session.domain.vo.ToolCallStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class ToolCallResponse(
    @Schema(description = "툴콜 ID") val id: String,
    @Schema(description = "세션 ID") val sessionId: String,
    @Schema(description = "메시지 ID") val messageId: String?,
    @Schema(description = "툴 이름") val toolName: String,
    @Schema(description = "인자 (JSON)") val argsJson: String,
    @Schema(description = "결과 (JSON)") val resultJson: String?,
    @Schema(description = "상태") val status: ToolCallStatus,
    @Schema(description = "시작 시각") val startedAt: Instant,
    @Schema(description = "종료 시각") val finishedAt: Instant?,
    @Schema(description = "에러 메시지") val errorMessage: String?
) {
    companion object {
        fun from(domain: ToolCall): ToolCallResponse = ToolCallResponse(
            id = domain.id.orEmpty(),
            sessionId = domain.sessionId,
            messageId = domain.messageId,
            toolName = domain.toolName,
            argsJson = domain.argsJson,
            resultJson = domain.resultJson,
            status = domain.status,
            startedAt = domain.startedAt,
            finishedAt = domain.finishedAt,
            errorMessage = domain.errorMessage
        )
    }
}
