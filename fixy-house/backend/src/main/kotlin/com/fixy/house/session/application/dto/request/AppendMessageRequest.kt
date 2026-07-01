package com.fixy.house.session.application.dto.request

import com.fixy.house.session.domain.vo.MessageRole
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant

data class AppendMessageRequest(
    @field:Schema(description = "에이전트가 발급한 메시지 ID (멱등키)")
    val clientMessageId: String? = null,

    @field:Schema(description = "메시지 역할")
    @field:NotNull
    val role: MessageRole,

    @field:Schema(description = "메시지 본문")
    @field:NotBlank
    val content: String,

    @field:Schema(description = "연결된 툴 호출 ID (role=TOOL 일 때)")
    val toolCallId: String? = null,

    @field:Schema(description = "세션 내 시퀀스 (0부터 시작)")
    @field:Min(0)
    val sequence: Int,

    @field:Schema(description = "생성 시각 (없으면 서버 시각)")
    val createdAt: Instant? = null
)
