package com.fixy.house.session.domain

import com.fixy.house.session.domain.vo.MessageRole
import java.time.Instant

interface MessageRepository {
    fun findById(messageId: String): Message?
    fun findBySessionIdAndSequence(sessionId: String, sequence: Int): Message?
    fun findAllBySessionId(sessionId: String): List<Message>
    fun deleteAllBySessionId(sessionId: String)
    fun save(message: Message): Message
}
