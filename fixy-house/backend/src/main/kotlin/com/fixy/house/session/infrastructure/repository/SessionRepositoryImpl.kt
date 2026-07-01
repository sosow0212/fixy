package com.fixy.house.session.infrastructure.repository

import com.fixy.house.session.domain.Session
import com.fixy.house.session.domain.SessionRepository
import com.fixy.house.session.domain.vo.SessionStatus
import com.fixy.house.session.infrastructure.entity.SessionEntity
import org.springframework.stereotype.Repository

@Repository
class SessionRepositoryImpl(
    private val sessionMongoRepository: SessionMongoRepository
) : SessionRepository {

    override fun findById(sessionId: String): Session? =
        sessionMongoRepository.findById(sessionId).orElse(null)?.toDomain()

    override fun findByAgentIdAndSessionIdFromAgent(agentId: String, sessionIdFromAgent: String): Session? =
        sessionMongoRepository.findByAgentIdAndSessionIdFromAgent(agentId, sessionIdFromAgent)?.toDomain()

    override fun findAllByTeamId(teamId: String): List<Session> =
        sessionMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun findAllByAgentId(agentId: String): List<Session> =
        sessionMongoRepository.findAllByAgentId(agentId).map { it.toDomain() }

    override fun findAllByTeamIdAndStatus(teamId: String, status: SessionStatus): List<Session> =
        sessionMongoRepository.findAllByTeamIdAndStatus(teamId, status).map { it.toDomain() }

    override fun findAllByTeamIdAndProjectNameAndStatus(teamId: String, projectName: String, status: SessionStatus?): List<Session> =
        sessionMongoRepository.findAllByTeamIdAndProjectNameAndStatus(teamId, projectName, status).map { it.toDomain() }

    override fun save(session: Session): Session =
        sessionMongoRepository.save(SessionEntity.from(session)).toDomain()

    override fun delete(session: Session) {
        session.id?.let { sessionMongoRepository.deleteById(it) }
    }
}
