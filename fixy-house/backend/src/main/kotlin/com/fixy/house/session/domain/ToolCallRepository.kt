package com.fixy.house.session.domain

import com.fixy.house.session.domain.vo.ToolCallStatus

interface ToolCallRepository {
    fun findById(toolCallId: String): ToolCall?
    fun findBySessionIdAndToolNameAndStartedAt(sessionId: String, toolName: String, startedAt: java.time.Instant): ToolCall?
    fun findAllBySessionId(sessionId: String): List<ToolCall>
    fun findAllBySessionIdAndStatus(sessionId: String, status: ToolCallStatus): List<ToolCall>
    fun deleteAllBySessionId(sessionId: String)
    fun save(toolCall: ToolCall): ToolCall
}
