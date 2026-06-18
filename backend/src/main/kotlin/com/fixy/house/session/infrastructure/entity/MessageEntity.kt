package com.fixy.house.session.infrastructure.entity

import com.fixy.house.session.domain.Message
import com.fixy.house.session.domain.vo.MessageRole
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "session_messages")
@CompoundIndexes(
    CompoundIndex(name = "session_sequence_unique", def = "{'session_id': 1, 'sequence': 1}", unique = true)
)
class MessageEntity(
    @Id
    var id: String? = null,

    @Indexed
    @Field(name = "session_id")
    var sessionId: String,

    @Field(name = "role")
    var role: MessageRole,

    @Field(name = "content")
    var content: String,

    @Field(name = "tool_call_id")
    var toolCallId: String? = null,

    @Field(name = "sequence")
    var sequence: Int,

    @Field(name = "created_at")
    var createdAt: Instant
) {

    fun toDomain(): Message = Message(
        id = id,
        sessionId = sessionId,
        role = role,
        content = content,
        toolCallId = toolCallId,
        sequence = sequence,
        createdAt = createdAt
    )

    companion object {
        fun from(domain: Message): MessageEntity = MessageEntity(
            id = domain.id,
            sessionId = domain.sessionId,
            role = domain.role,
            content = domain.content,
            toolCallId = domain.toolCallId,
            sequence = domain.sequence,
            createdAt = domain.createdAt
        )
    }
}
