package com.fixy.house.session.infrastructure.entity

import com.fixy.house.global.MongoAuditableEntity
import com.fixy.house.session.domain.Session
import com.fixy.house.session.domain.vo.SessionStatus
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "sessions")
@CompoundIndexes(
    CompoundIndex(name = "agent_sessionId_unique", def = "{'agent_id': 1, 'session_id_from_agent': 1}", unique = true),
    CompoundIndex(name = "team_status", def = "{'team_id': 1, 'status': 1}")
)
class SessionEntity(
    @Id
    var id: String? = null,

    @Indexed
    @Field(name = "agent_id")
    var agentId: String,

    @Indexed
    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "session_id_from_agent")
    var sessionIdFromAgent: String,

    @Field(name = "user_id_on_agent")
    var userIdOnAgent: String? = null,

    @Field(name = "project_name")
    var projectName: String? = null,

    @Field(name = "status")
    var status: SessionStatus = SessionStatus.ACTIVE,

    @Field(name = "started_at")
    var startedAt: Instant,

    @Field(name = "ended_at")
    var endedAt: Instant? = null,

    @Field(name = "message_count")
    var messageCount: Int = 0,

    @Field(name = "tool_call_count")
    var toolCallCount: Int = 0,

    @Field(name = "episode_count")
    var episodeCount: Int = 0,

    @Field(name = "summary")
    var summary: String? = null,

    @Field(name = "last_activity_at")
    var lastActivityAt: Instant = Instant.now(),

    @Field(name = "tags")
    var tags: List<String> = emptyList(),

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): Session = Session(
        id = id,
        agentId = agentId,
        teamId = teamId,
        sessionIdFromAgent = sessionIdFromAgent,
        userIdOnAgent = userIdOnAgent,
        projectName = projectName,
        status = status,
        startedAt = startedAt,
        endedAt = endedAt,
        messageCount = messageCount,
        toolCallCount = toolCallCount,
        episodeCount = episodeCount,
        summary = summary,
        lastActivityAt = lastActivityAt,
        tags = tags
    ).also {
        it.createdAt = createdAt
        it.updatedAt = updatedAt
    }

    companion object {
        fun from(domain: Session): SessionEntity = SessionEntity(
            id = domain.id,
            agentId = domain.agentId,
            teamId = domain.teamId,
            sessionIdFromAgent = domain.sessionIdFromAgent,
            userIdOnAgent = domain.userIdOnAgent,
            projectName = domain.projectName,
            status = domain.status,
            startedAt = domain.startedAt,
            endedAt = domain.endedAt,
            messageCount = domain.messageCount,
            toolCallCount = domain.toolCallCount,
            episodeCount = domain.episodeCount,
            summary = domain.summary,
            lastActivityAt = domain.lastActivityAt,
            tags = domain.tags
        ).also {
            it.createdAt = domain.createdAt
            it.updatedAt = domain.updatedAt
        }
    }
}
