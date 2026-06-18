package com.fixy.house.agent.infrastructure.entity

import com.fixy.house.agent.domain.Agent
import com.fixy.house.agent.domain.vo.AgentStatus
import com.fixy.house.global.MongoAuditableEntity
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "agents")
@CompoundIndexes(
    CompoundIndex(name = "agent_team_name_unique", def = "{'team_id': 1, 'name': 1}", unique = true)
)
class AgentEntity(
    @Id
    var id: String? = null,

    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "name")
    var name: String,

    @Field(name = "status")
    var status: AgentStatus,

    @Field(name = "agent_key_hash")
    var agentKeyHash: String,

    @Field(name = "agent_key_last_four")
    var agentKeyLastFour: String,

    @Field(name = "last_connected_at")
    var lastConnectedAt: Instant? = null,

    @Field(name = "created_by_user_id")
    var createdByUserId: String,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): Agent = Agent(
        id = id,
        teamId = teamId,
        name = name,
        status = status,
        agentKeyHash = agentKeyHash,
        agentKeyLastFour = agentKeyLastFour,
        lastConnectedAt = lastConnectedAt,
        createdByUserId = createdByUserId
    ).also { it.createdAt = createdAt; it.updatedAt = updatedAt }

    companion object {
        fun from(domain: Agent): AgentEntity = AgentEntity(
            id = domain.id,
            teamId = domain.teamId,
            name = domain.name,
            status = domain.status,
            agentKeyHash = domain.agentKeyHash,
            agentKeyLastFour = domain.agentKeyLastFour,
            lastConnectedAt = domain.lastConnectedAt,
            createdByUserId = domain.createdByUserId
        ).also { entity ->
            domain.createdAt = entity.createdAt
            domain.updatedAt = entity.updatedAt
        }
    }
}
