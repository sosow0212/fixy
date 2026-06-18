package com.fixy.house.agent.application.service

import com.fixy.house.agent.application.dto.request.CreateAgentRequest
import com.fixy.house.agent.application.dto.request.UpdateAgentRequest
import com.fixy.house.agent.application.dto.response.AgentKeyResponse
import com.fixy.house.agent.application.dto.response.AgentSummaryResponse
import com.fixy.house.agent.domain.Agent
import com.fixy.house.agent.domain.AgentRepository
import com.fixy.house.agent.domain.exception.AgentExceptionType
import com.fixy.house.agent.domain.policy.AgentKeyGenerator
import com.fixy.house.agent.domain.vo.AgentStatus
import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.team.application.service.TeamService
import com.fixy.house.team.domain.vo.TeamRole
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class AgentService(
    private val agentRepository: AgentRepository,
    private val teamService: TeamService,
    private val agentKeyGenerator: AgentKeyGenerator,
    private val passwordEncoder: PasswordEncoder
) {

    @Transactional
    fun createAgent(actorUserId: String, teamId: String, request: CreateAgentRequest): AgentKeyResponse {
        teamService.requireRoleAtLeast(actorUserId, teamId, TeamRole.MANAGER)
        if (agentRepository.existsByTeamIdAndName(teamId, request.name)) {
            throw CustomException(AgentExceptionType.AGENT_NAME_ALREADY_IN_USE)
        }
        val rawKey = agentKeyGenerator.generateRawKey()
        val keyHash = passwordEncoder.encode(rawKey)
        val lastFour = agentKeyGenerator.lastFourOf(rawKey)
        val agent = agentRepository.save(
            Agent(
                teamId = teamId,
                name = request.name,
                status = AgentStatus.ACTIVE,
                agentKeyHash = keyHash,
                agentKeyLastFour = lastFour,
                createdByUserId = actorUserId
            )
        )
        return AgentKeyResponse(AgentSummaryResponse.from(agent), rawKey)
    }

    @Transactional(readOnly = true)
    fun listAgents(actorUserId: String, teamId: String): List<AgentSummaryResponse> {
        teamService.requireMember(actorUserId, teamId)
        return agentRepository.findAllByTeamId(teamId)
            .map { AgentSummaryResponse.from(it) }
            .sortedBy { it.name }
    }

    @Transactional(readOnly = true)
    fun getAgent(actorUserId: String, agentId: String): AgentSummaryResponse {
        val agent = findAgentById(agentId)
        teamService.requireMember(actorUserId, agent.teamId)
        return AgentSummaryResponse.from(agent)
    }

    @Transactional
    fun rotateKey(actorUserId: String, agentId: String): AgentKeyResponse {
        val agent = findAgentById(agentId)
        teamService.requireRoleAtLeast(actorUserId, agent.teamId, TeamRole.MANAGER)
        val rawKey = agentKeyGenerator.generateRawKey()
        val keyHash = passwordEncoder.encode(rawKey)
        val lastFour = agentKeyGenerator.lastFourOf(rawKey)
        agent.rotateKey(keyHash, lastFour)
        val saved = agentRepository.save(agent)
        return AgentKeyResponse(AgentSummaryResponse.from(saved), rawKey)
    }

    @Transactional
    fun updateAgent(actorUserId: String, agentId: String, request: UpdateAgentRequest): AgentSummaryResponse {
        val agent = findAgentById(agentId)
        teamService.requireRoleAtLeast(actorUserId, agent.teamId, TeamRole.MANAGER)
        request.name?.let { agent.rename(it) }
        request.status?.let { agent.changeStatus(it) }
        val saved = agentRepository.save(agent)
        return AgentSummaryResponse.from(saved)
    }

    @Transactional
    fun deleteAgent(actorUserId: String, agentId: String) {
        val agent = findAgentById(agentId)
        teamService.requireRoleAtLeast(actorUserId, agent.teamId, TeamRole.OWNER)
        agentRepository.delete(agent)
    }

    @Transactional
    fun authenticateByKey(rawKey: String): Agent {
        val activeAgents = agentRepository.findAllByStatus(AgentStatus.ACTIVE)
        val matched = activeAgents.firstOrNull { passwordEncoder.matches(rawKey, it.agentKeyHash) }
            ?: throw CustomException(AgentExceptionType.INVALID_AGENT_KEY)
        matched.markConnected(Instant.now())
        return agentRepository.save(matched)
    }

    fun findAgentById(agentId: String): Agent =
        agentRepository.findById(agentId) ?: throw CustomException(AgentExceptionType.AGENT_NOT_FOUND)
}
