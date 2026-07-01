package com.fixy.house.session.domain

import com.fixy.house.session.domain.vo.Signal
import java.time.Instant

/**
 * fixy-agent L1 에피소드.
 * - episodeId 는 fixy-agent 가 발급한 id 그대로 (예: "mqi28h9l-y5f-1-41gx").
 * - (agentId, episodeId) 가 유니크.
 */
class Episode(
    var id: String? = null,
    var episodeId: String,
    var sessionId: String,
    var agentId: String,
    var teamId: String,
    var ts: Instant,
    var signal: Signal,
    var summary: String,
    var tags: List<String> = emptyList(),
    var files: List<String> = emptyList(),
    var projectName: String? = null,
    var promotedTo: String? = null
) {

    init {
        require(episodeId.isNotBlank()) { "episodeId 는 비어 있을 수 없습니다." }
        require(sessionId.isNotBlank()) { "sessionId 는 비어 있을 수 없습니다." }
        require(agentId.isNotBlank()) { "agentId 는 비어 있을 수 없습니다." }
        require(teamId.isNotBlank()) { "teamId 는 비어 있을 수 없습니다." }
        require(summary.isNotBlank()) { "summary 는 비어 있을 수 없습니다." }
    }

    fun markPromoted(skillName: String) {
        this.promotedTo = skillName
    }
}
