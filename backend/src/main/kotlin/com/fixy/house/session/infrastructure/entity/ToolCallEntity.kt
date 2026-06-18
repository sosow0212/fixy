package com.fixy.house.session.infrastructure.entity

import com.fixy.house.session.domain.ToolCall
import com.fixy.house.session.domain.vo.ToolCallStatus
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "session_tool_calls")
class ToolCallEntity(
    @Id
    var id: String? = null,

    @Indexed
    @Field(name = "session_id")
    var sessionId: String,

    @Field(name = "message_id")
    var messageId: String? = null,

    @Field(name = "tool_name")
    var toolName: String,

    @Field(name = "args_json")
    var argsJson: String,

    @Field(name = "result_json")
    var resultJson: String? = null,

    @Field(name = "status")
    var status: ToolCallStatus = ToolCallStatus.PENDING,

    @Field(name = "started_at")
    var startedAt: Instant,

    @Field(name = "finished_at")
    var finishedAt: Instant? = null,

    @Field(name = "error_message")
    var errorMessage: String? = null
) {

    fun toDomain(): ToolCall = ToolCall(
        id = id,
        sessionId = sessionId,
        messageId = messageId,
        toolName = toolName,
        argsJson = argsJson,
        resultJson = resultJson,
        status = status,
        startedAt = startedAt,
        finishedAt = finishedAt,
        errorMessage = errorMessage
    )

    companion object {
        fun from(domain: ToolCall): ToolCallEntity = ToolCallEntity(
            id = domain.id,
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
