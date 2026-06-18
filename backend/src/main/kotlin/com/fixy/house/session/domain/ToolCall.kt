package com.fixy.house.session.domain

import com.fixy.house.session.domain.vo.ToolCallStatus
import java.time.Instant

class ToolCall(
    var id: String? = null,
    var sessionId: String,
    var messageId: String? = null,
    var toolName: String,
    var argsJson: String,
    var resultJson: String? = null,
    var status: ToolCallStatus = ToolCallStatus.PENDING,
    var startedAt: Instant,
    var finishedAt: Instant? = null,
    var errorMessage: String? = null
) {

    init {
        require(sessionId.isNotBlank()) { "sessionId 는 비어 있을 수 없습니다." }
        require(toolName.isNotBlank()) { "toolName 은 비어 있을 수 없습니다." }
    }

    fun finish(success: Boolean, resultJson: String?, errorMessage: String?, finishedAt: Instant = Instant.now()) {
        this.status = if (success) ToolCallStatus.SUCCESS else ToolCallStatus.FAILED
        this.resultJson = resultJson
        this.errorMessage = errorMessage
        this.finishedAt = finishedAt
    }
}
