package com.fixy.house.session.application.service

import com.fixy.house.agent.domain.Agent
import com.fixy.house.agent.domain.AgentRepository
import com.fixy.house.global.exceptions.CommonExceptionType
import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.session.application.dto.request.AppendEpisodeRequest
import com.fixy.house.session.application.dto.request.AppendMessageRequest
import com.fixy.house.session.application.dto.request.AppendToolCallRequest
import com.fixy.house.session.application.dto.request.EndSessionRequest
import com.fixy.house.session.application.dto.request.FinishToolCallRequest
import com.fixy.house.session.application.dto.request.StartSessionRequest
import com.fixy.house.session.application.dto.request.UpdateSessionRequest
import com.fixy.house.session.application.dto.response.EpisodeResponse
import com.fixy.house.session.application.dto.response.MessageResponse
import com.fixy.house.session.application.dto.response.SessionDetailResponse
import com.fixy.house.session.application.dto.response.SessionSummaryResponse
import com.fixy.house.session.application.dto.response.ToolCallResponse
import com.fixy.house.session.domain.Episode
import com.fixy.house.session.domain.EpisodeRepository
import com.fixy.house.session.domain.Message
import com.fixy.house.session.domain.MessageRepository
import com.fixy.house.session.domain.Session
import com.fixy.house.session.domain.SessionRepository
import com.fixy.house.session.domain.ToolCall
import com.fixy.house.session.domain.ToolCallRepository
import com.fixy.house.session.domain.exception.SessionExceptionType
import com.fixy.house.session.domain.vo.SessionStatus
import com.fixy.house.team.application.service.TeamService
import com.fixy.house.team.domain.vo.TeamRole
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class SessionService(
    private val sessionRepository: SessionRepository,
    private val messageRepository: MessageRepository,
    private val toolCallRepository: ToolCallRepository,
    private val episodeRepository: EpisodeRepository,
    private val agentRepository: AgentRepository,
    private val teamService: TeamService
) {

    // ── Agent ingress ────────────────────────────────────────────────────

    @Transactional
    fun startSessionByAgent(agentId: String, request: StartSessionRequest): SessionSummaryResponse {
        val agent = loadAgent(agentId)
        if (agent.teamId != request.teamId) {
            throw CustomException(SessionExceptionType.AGENT_TEAM_MISMATCH)
        }
        val existing = sessionRepository.findByAgentIdAndSessionIdFromAgent(agentId, request.sessionIdFromAgent)
        if (existing != null) {
            return SessionSummaryResponse.from(existing)
        }
        val now = Instant.now()
        val session = Session.start(
            agentId = agentId,
            teamId = request.teamId,
            sessionIdFromAgent = request.sessionIdFromAgent,
            userIdOnAgent = request.userIdOnAgent,
            projectName = request.projectName,
            startedAt = request.startedAt ?: now
        )
        return SessionSummaryResponse.from(sessionRepository.save(session))
    }

    @Transactional
    fun endSessionByAgent(agentId: String, sessionIdFromAgent: String, request: EndSessionRequest): SessionSummaryResponse {
        val session = loadSessionByAgent(agentId, sessionIdFromAgent)
        session.end(
            newStatus = request.status,
            endedAt = request.endedAt ?: Instant.now(),
            summary = request.summary
        )
        return SessionSummaryResponse.from(sessionRepository.save(session))
    }

    @Transactional
    fun appendMessageByAgent(agentId: String, sessionIdFromAgent: String, request: AppendMessageRequest): MessageResponse {
        val session = loadSessionByAgent(agentId, sessionIdFromAgent)
        // 멱등: (sessionId, sequence) 가 이미 있으면 그대로 반환
        val existing = messageRepository.findBySessionIdAndSequence(session.id!!, request.sequence)
        if (existing != null) return MessageResponse.from(existing)

        val message = messageRepository.save(
            Message(
                sessionId = session.id!!,
                role = request.role,
                content = request.content,
                toolCallId = request.toolCallId,
                sequence = request.sequence,
                createdAt = request.createdAt ?: Instant.now()
            )
        )
        session.recordMessageAppended(message.createdAt)
        sessionRepository.save(session)
        return MessageResponse.from(message)
    }

    @Transactional
    fun appendToolCallByAgent(agentId: String, sessionIdFromAgent: String, request: AppendToolCallRequest): ToolCallResponse {
        val session = loadSessionByAgent(agentId, sessionIdFromAgent)
        val toolCall = toolCallRepository.save(
            ToolCall(
                sessionId = session.id!!,
                messageId = request.messageId,
                toolName = request.toolName,
                argsJson = request.argsJson,
                status = request.status,
                startedAt = request.startedAt
            )
        )
        session.recordToolCallAppended(toolCall.startedAt)
        sessionRepository.save(session)
        return ToolCallResponse.from(toolCall)
    }

    @Transactional
    fun finishToolCallByAgent(
        agentId: String,
        sessionIdFromAgent: String,
        toolCallMongoId: String,
        request: FinishToolCallRequest
    ): ToolCallResponse {
        val session = loadSessionByAgent(agentId, sessionIdFromAgent)
        val toolCall = toolCallRepository.findById(toolCallMongoId)
            ?: throw CustomException(SessionExceptionType.TOOL_CALL_NOT_FOUND)
        if (toolCall.sessionId != session.id) {
            throw CustomException(SessionExceptionType.SESSION_FORBIDDEN)
        }
        toolCall.finish(
            success = request.status.name == "SUCCESS",
            resultJson = request.resultJson,
            errorMessage = request.errorMessage,
            finishedAt = request.finishedAt ?: Instant.now()
        )
        return ToolCallResponse.from(toolCallRepository.save(toolCall))
    }

    @Transactional
    fun appendEpisodeByAgent(agentId: String, sessionIdFromAgent: String, request: AppendEpisodeRequest): EpisodeResponse {
        val session = loadSessionByAgent(agentId, sessionIdFromAgent)
        val existing = episodeRepository.findByAgentIdAndEpisodeId(agentId, request.episodeId)
        if (existing != null) return EpisodeResponse.from(existing)

        val episode = episodeRepository.save(
            Episode(
                episodeId = request.episodeId,
                sessionId = session.id!!,
                agentId = agentId,
                teamId = session.teamId,
                ts = request.ts,
                signal = request.signal,
                summary = request.summary,
                tags = request.tags,
                files = request.files,
                projectName = request.projectName,
                promotedTo = request.promotedTo
            )
        )
        session.recordEpisodeAppended(episode.ts)
        sessionRepository.save(session)
        return EpisodeResponse.from(episode)
    }

    // ── User-facing ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun listByTeam(
        actorUserId: String,
        teamId: String,
        statuses: List<SessionStatus>?,
        projectName: String?,
        limit: Int
    ): List<SessionSummaryResponse> {
        teamService.requireMember(actorUserId, teamId)
        val sessions = when {
            !statuses.isNullOrEmpty() && projectName != null ->
                statuses.flatMap { sessionRepository.findAllByTeamIdAndProjectNameAndStatus(teamId, projectName, it) }
            !statuses.isNullOrEmpty() ->
                statuses.flatMap { sessionRepository.findAllByTeamIdAndStatus(teamId, it) }
            else -> sessionRepository.findAllByTeamId(teamId)
        }
        return sessions
            .sortedByDescending { it.lastActivityAt }
            .take(limit.coerceIn(1, 200))
            .map(SessionSummaryResponse::from)
    }

    @Transactional(readOnly = true)
    fun getDetail(actorUserId: String, sessionId: String, recentLimit: Int = 200): SessionDetailResponse {
        val session = sessionRepository.findById(sessionId)
            ?: throw CustomException(SessionExceptionType.SESSION_NOT_FOUND)
        teamService.requireMember(actorUserId, session.teamId)
        val cap = recentLimit.coerceIn(1, 500)
        return SessionDetailResponse(
            session = SessionSummaryResponse.from(session),
            messages = messageRepository.findAllBySessionId(sessionId).takeLast(cap).map(MessageResponse::from),
            toolCalls = toolCallRepository.findAllBySessionId(sessionId).takeLast(cap).map(ToolCallResponse::from),
            episodes = episodeRepository.findAllBySessionId(sessionId).takeLast(cap).map(EpisodeResponse::from)
        )
    }

    @Transactional
    fun updateMetadata(actorUserId: String, sessionId: String, request: UpdateSessionRequest): SessionSummaryResponse {
        val session = sessionRepository.findById(sessionId)
            ?: throw CustomException(SessionExceptionType.SESSION_NOT_FOUND)
        teamService.requireMember(actorUserId, session.teamId)
        session.updateUserMetadata(request.summary, request.tags)
        return SessionSummaryResponse.from(sessionRepository.save(session))
    }

    @Transactional
    fun delete(actorUserId: String, sessionId: String) {
        val session = sessionRepository.findById(sessionId)
            ?: throw CustomException(SessionExceptionType.SESSION_NOT_FOUND)
        teamService.requireRoleAtLeast(actorUserId, session.teamId, TeamRole.MANAGER)
        messageRepository.deleteAllBySessionId(sessionId)
        toolCallRepository.deleteAllBySessionId(sessionId)
        episodeRepository.deleteAllBySessionId(sessionId)
        sessionRepository.delete(session)
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    fun loadSessionByAgent(agentId: String, sessionIdFromAgent: String): Session {
        val session = sessionRepository.findByAgentIdAndSessionIdFromAgent(agentId, sessionIdFromAgent)
            ?: throw CustomException(SessionExceptionType.SESSION_NOT_FOUND)
        if (!session.ownedBy(agentId)) {
            throw CustomException(SessionExceptionType.SESSION_FORBIDDEN)
        }
        return session
    }

    private fun loadAgent(agentId: String): Agent =
        agentRepository.findById(agentId) ?: throw CustomException(CommonExceptionType.NOT_FOUND, "에이전트를 찾을 수 없습니다.")
}
