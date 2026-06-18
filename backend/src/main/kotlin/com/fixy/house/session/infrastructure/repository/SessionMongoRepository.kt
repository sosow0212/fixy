package com.fixy.house.session.infrastructure.repository

import com.fixy.house.session.domain.vo.SessionStatus
import com.fixy.house.session.infrastructure.entity.SessionEntity
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.data.mongodb.repository.Query

interface SessionMongoRepository : MongoRepository<SessionEntity, String> {
    fun findByAgentIdAndSessionIdFromAgent(agentId: String, sessionIdFromAgent: String): SessionEntity?
    fun findAllByTeamId(teamId: String): List<SessionEntity>
    fun findAllByAgentId(agentId: String): List<SessionEntity>
    fun findAllByTeamIdAndStatus(teamId: String, status: SessionStatus): List<SessionEntity>

    @Query("{ 'team_id': ?0, 'project_name': ?1, 'status': ?2 }")
    fun findAllByTeamIdAndProjectNameAndStatus(teamId: String, projectName: String, status: SessionStatus?): List<SessionEntity>
}
