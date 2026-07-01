package com.fixy.house.session.domain

import com.fixy.house.session.domain.vo.SessionStatus
import java.time.Instant

interface SessionRepository {
    fun findById(sessionId: String): Session?
    fun findByAgentIdAndSessionIdFromAgent(agentId: String, sessionIdFromAgent: String): Session?
    fun findAllByTeamId(teamId: String): List<Session>
    fun findAllByAgentId(agentId: String): List<Session>
    fun findAllByTeamIdAndStatus(teamId: String, status: SessionStatus): List<Session>
    fun findAllByTeamIdAndProjectNameAndStatus(teamId: String, projectName: String, status: SessionStatus?): List<Session>
    fun save(session: Session): Session
    fun delete(session: Session)
}
