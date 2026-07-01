package com.fixy.house.agent.domain

import com.fixy.house.agent.domain.vo.AgentStatus

interface AgentRepository {
    fun findById(agentId: String): Agent?
    fun findAllByTeamId(teamId: String): List<Agent>
    fun existsByTeamIdAndName(teamId: String, name: String): Boolean
    fun save(agent: Agent): Agent
    fun delete(agent: Agent)
    fun findAllByStatus(status: AgentStatus): List<Agent>
}
