package com.fixy.house.session.infrastructure.repository

import com.fixy.house.session.domain.ToolCall
import com.fixy.house.session.domain.ToolCallRepository
import com.fixy.house.session.domain.vo.ToolCallStatus
import com.fixy.house.session.infrastructure.entity.ToolCallEntity
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository
import java.time.Instant

interface ToolCallMongoRepository : MongoRepository<ToolCallEntity, String> {
    fun findBySessionIdAndToolNameAndStartedAt(sessionId: String, toolName: String, startedAt: Instant): ToolCallEntity?
    fun findAllBySessionIdOrderByStartedAtAsc(sessionId: String): List<ToolCallEntity>
    fun findAllBySessionIdAndStatus(sessionId: String, status: ToolCallStatus): List<ToolCallEntity>
    fun deleteBySessionId(sessionId: String)
}

@Repository
class ToolCallRepositoryImpl(
    private val toolCallMongoRepository: ToolCallMongoRepository
) : ToolCallRepository {
    override fun findById(toolCallId: String): ToolCall? =
        toolCallMongoRepository.findById(toolCallId).orElse(null)?.toDomain()

    override fun findBySessionIdAndToolNameAndStartedAt(sessionId: String, toolName: String, startedAt: Instant): ToolCall? =
        toolCallMongoRepository.findBySessionIdAndToolNameAndStartedAt(sessionId, toolName, startedAt)?.toDomain()

    override fun findAllBySessionId(sessionId: String): List<ToolCall> =
        toolCallMongoRepository.findAllBySessionIdOrderByStartedAtAsc(sessionId).map { it.toDomain() }

    override fun findAllBySessionIdAndStatus(sessionId: String, status: ToolCallStatus): List<ToolCall> =
        toolCallMongoRepository.findAllBySessionIdAndStatus(sessionId, status).map { it.toDomain() }

    override fun deleteAllBySessionId(sessionId: String) =
        toolCallMongoRepository.deleteBySessionId(sessionId)

    override fun save(toolCall: ToolCall): ToolCall =
        toolCallMongoRepository.save(ToolCallEntity.from(toolCall)).toDomain()
}
