package com.fixy.house.session.domain

import com.fixy.house.global.BaseEntity
import com.fixy.house.session.domain.vo.SessionStatus
import java.time.Instant

/**
 * fixy-agent 의 한 세션.
 * - agentId + sessionIdFromAgent 가 유니크.
 * - 메시지/툴콜/에피소드 카운트는 append 시 도메인 메서드가 갱신.
 */
class Session(
    var id: String? = null,
    var agentId: String,
    var teamId: String,
    var sessionIdFromAgent: String,
    var userIdOnAgent: String? = null,
    var projectName: String? = null,
    var status: SessionStatus = SessionStatus.ACTIVE,
    var startedAt: Instant,
    var endedAt: Instant? = null,
    var messageCount: Int = 0,
    var toolCallCount: Int = 0,
    var episodeCount: Int = 0,
    var summary: String? = null,
    var lastActivityAt: Instant = Instant.now(),
    var tags: List<String> = emptyList()
) : BaseEntity() {

    init {
        require(agentId.isNotBlank()) { "agentId 는 비어 있을 수 없습니다." }
        require(teamId.isNotBlank()) { "teamId 는 비어 있을 수 없습니다." }
        require(sessionIdFromAgent.isNotBlank()) { "sessionIdFromAgent 는 비어 있을 수 없습니다." }
        require(messageCount >= 0) { "messageCount 는 0 이상." }
        require(toolCallCount >= 0) { "toolCallCount 는 0 이상." }
        require(episodeCount >= 0) { "episodeCount 는 0 이상." }
    }

    fun ownedBy(agentId: String): Boolean = this.agentId == agentId

    fun recordMessageAppended(now: Instant = Instant.now()) {
        check(!status.isTerminal) { "이미 종료된 세션입니다." }
        this.messageCount += 1
        this.lastActivityAt = now
    }

    fun recordToolCallAppended(now: Instant = Instant.now()) {
        check(!status.isTerminal) { "이미 종료된 세션입니다." }
        this.toolCallCount += 1
        this.lastActivityAt = now
    }

    fun recordEpisodeAppended(now: Instant = Instant.now()) {
        check(!status.isTerminal) { "이미 종료된 세션입니다." }
        this.episodeCount += 1
        this.lastActivityAt = now
    }

    fun end(newStatus: SessionStatus, endedAt: Instant = Instant.now(), summary: String? = null) {
        require(newStatus == SessionStatus.COMPLETED || newStatus == SessionStatus.FAILED) {
            "종료 상태는 COMPLETED/FAILED 만 가능합니다."
        }
        this.status = newStatus
        this.endedAt = endedAt
        summary?.let { this.summary = it }
    }

    fun markIdle(now: Instant = Instant.now()) {
        if (!status.isTerminal) {
            this.status = SessionStatus.IDLE
            this.lastActivityAt = now
        }
    }

    fun updateUserMetadata(newSummary: String?, newTags: List<String>?) {
        newSummary?.let { this.summary = it.takeIf { s -> s.isNotBlank() } }
        newTags?.let { this.tags = it }
    }

    companion object {
        fun start(
            agentId: String,
            teamId: String,
            sessionIdFromAgent: String,
            userIdOnAgent: String?,
            projectName: String?,
            startedAt: Instant
        ): Session = Session(
            agentId = agentId,
            teamId = teamId,
            sessionIdFromAgent = sessionIdFromAgent,
            userIdOnAgent = userIdOnAgent,
            projectName = projectName,
            status = SessionStatus.ACTIVE,
            startedAt = startedAt,
            lastActivityAt = startedAt
        )
    }
}
