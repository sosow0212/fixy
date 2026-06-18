package com.fixy.house.agent.infrastructure.repository

import com.fixy.house.agent.domain.vo.AgentStatus
import com.fixy.house.agent.infrastructure.entity.AgentEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface AgentMongoRepository : MongoRepository<AgentEntity, String> {
    fun findAllByTeamId(teamId: String): List<AgentEntity>
    fun existsByTeamIdAndName(teamId: String, name: String): Boolean
    fun findAllByStatus(status: AgentStatus): List<AgentEntity>
}
