package com.fixy.house.session.application.dto.response

import com.fixy.house.session.domain.Message
import com.fixy.house.session.domain.vo.MessageRole
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

data class MessageResponse(
    @Schema(description = "메시지 ID") val id: String,
    @Schema(description = "세션 ID") val sessionId: String,
    @Schema(description = "역할") val role: MessageRole,
    @Schema(description = "본문") val content: String,
    @Schema(description = "연결된 툴콜 ID") val toolCallId: String?,
    @Schema(description = "시퀀스") val sequence: Int,
    @Schema(description = "생성 시각") val createdAt: Instant
) {
    companion object {
        fun from(domain: Message): MessageResponse = MessageResponse(
            id = domain.id.orEmpty(),
            sessionId = domain.sessionId,
            role = domain.role,
            content = domain.content,
            toolCallId = domain.toolCallId,
            sequence = domain.sequence,
            createdAt = domain.createdAt
        )
    }
}
