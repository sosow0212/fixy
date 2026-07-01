package com.fixy.house.session.domain

import com.fixy.house.session.domain.vo.MessageRole
import java.time.Instant

class Message(
    var id: String? = null,
    var sessionId: String,
    var role: MessageRole,
    var content: String,
    var toolCallId: String? = null,
    var sequence: Int,
    var createdAt: Instant
) {

    init {
        require(sessionId.isNotBlank()) { "sessionId 는 비어 있을 수 없습니다." }
        require(content.isNotBlank()) { "content 는 비어 있을 수 없습니다." }
        require(sequence >= 0) { "sequence 는 0 이상." }
    }
}
