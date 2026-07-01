package com.fixy.house.session.infrastructure.repository

import com.fixy.house.session.domain.Message
import com.fixy.house.session.domain.MessageRepository
import com.fixy.house.session.infrastructure.entity.MessageEntity
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

interface MessageMongoRepository : MongoRepository<MessageEntity, String> {
    fun findBySessionIdAndSequence(sessionId: String, sequence: Int): MessageEntity?
    fun findAllBySessionIdOrderBySequenceAsc(sessionId: String): List<MessageEntity>
    fun deleteBySessionId(sessionId: String)
}

@Repository
class MessageRepositoryImpl(
    private val messageMongoRepository: MessageMongoRepository
) : MessageRepository {
    override fun findById(messageId: String): Message? =
        messageMongoRepository.findById(messageId).orElse(null)?.toDomain()

    override fun findBySessionIdAndSequence(sessionId: String, sequence: Int): Message? =
        messageMongoRepository.findBySessionIdAndSequence(sessionId, sequence)?.toDomain()

    override fun findAllBySessionId(sessionId: String): List<Message> =
        messageMongoRepository.findAllBySessionIdOrderBySequenceAsc(sessionId).map { it.toDomain() }

    override fun deleteAllBySessionId(sessionId: String) =
        messageMongoRepository.deleteBySessionId(sessionId)

    override fun save(message: Message): Message =
        messageMongoRepository.save(MessageEntity.from(message)).toDomain()
}
