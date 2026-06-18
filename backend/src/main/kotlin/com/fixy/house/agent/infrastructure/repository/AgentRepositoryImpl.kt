package com.fixy.house.agent.infrastructure.repository

import com.fixy.house.agent.domain.Agent
import com.fixy.house.agent.domain.AgentRepository
import com.fixy.house.agent.domain.vo.AgentStatus
import com.fixy.house.agent.infrastructure.entity.AgentEntity
import org.springframework.stereotype.Repository

@Repository
class AgentRepositoryImpl(
    private val agentMongoRepository: AgentMongoRepository
) : AgentRepository {

    override fun findById(agentId: String): Agent? =
        agentMongoRepository.findById(agentId).orElse(null)?.toDomain()

    override fun findAllByTeamId(teamId: String): List<Agent> =
        agentMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun existsByTeamIdAndName(teamId: String, name: String): Boolean =
        agentMongoRepository.existsByTeamIdAndName(teamId, name)

    override fun save(agent: Agent): Agent =
        agentMongoRepository.save(AgentEntity.from(agent)).toDomain()

    override fun delete(agent: Agent) {
        agent.id?.let { agentMongoRepository.deleteById(it) }
    }

    override fun findAllByStatus(status: AgentStatus): List<Agent> =
        agentMongoRepository.findAllByStatus(status).map { it.toDomain() }
}
