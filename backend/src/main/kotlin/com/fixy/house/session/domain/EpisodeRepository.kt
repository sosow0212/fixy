package com.fixy.house.session.domain

import java.time.Instant

interface EpisodeRepository {
    fun findById(episodeMongoId: String): Episode?
    fun findByAgentIdAndEpisodeId(agentId: String, episodeId: String): Episode?
    fun findAllBySessionId(sessionId: String): List<Episode>
    fun findAllByTeamIdAndSignal(teamId: String, signal: com.fixy.house.session.domain.vo.Signal): List<Episode>
    fun findAllByTeamIdAndTsBetween(teamId: String, from: Instant, to: Instant): List<Episode>
    fun deleteAllBySessionId(sessionId: String)
    fun save(episode: Episode): Episode
}
