package com.fixy.house.session.infrastructure.repository

import com.fixy.house.session.domain.Episode
import com.fixy.house.session.domain.EpisodeRepository
import com.fixy.house.session.domain.vo.Signal
import com.fixy.house.session.infrastructure.entity.EpisodeEntity
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.data.mongodb.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant

interface EpisodeMongoRepository : MongoRepository<EpisodeEntity, String> {
    fun findByAgentIdAndEpisodeId(agentId: String, episodeId: String): EpisodeEntity?
    fun findAllBySessionIdOrderByTsAsc(sessionId: String): List<EpisodeEntity>
    fun findAllByTeamIdAndSignal(teamId: String, signal: Signal): List<EpisodeEntity>
    fun deleteBySessionId(sessionId: String)

    @Query("{ 'team_id': ?0, 'ts': { \$gte: ?1, \$lte: ?2 } }")
    fun findAllByTeamIdAndTsBetween(teamId: String, from: Instant, to: Instant): List<EpisodeEntity>
}

@Repository
class EpisodeRepositoryImpl(
    private val episodeMongoRepository: EpisodeMongoRepository
) : EpisodeRepository {
    override fun findById(episodeMongoId: String): Episode? =
        episodeMongoRepository.findById(episodeMongoId).orElse(null)?.toDomain()

    override fun findByAgentIdAndEpisodeId(agentId: String, episodeId: String): Episode? =
        episodeMongoRepository.findByAgentIdAndEpisodeId(agentId, episodeId)?.toDomain()

    override fun findAllBySessionId(sessionId: String): List<Episode> =
        episodeMongoRepository.findAllBySessionIdOrderByTsAsc(sessionId).map { it.toDomain() }

    override fun findAllByTeamIdAndSignal(teamId: String, signal: Signal): List<Episode> =
        episodeMongoRepository.findAllByTeamIdAndSignal(teamId, signal).map { it.toDomain() }

    override fun findAllByTeamIdAndTsBetween(teamId: String, from: Instant, to: Instant): List<Episode> =
        episodeMongoRepository.findAllByTeamIdAndTsBetween(teamId, from, to).map { it.toDomain() }

    override fun deleteAllBySessionId(sessionId: String) =
        episodeMongoRepository.deleteBySessionId(sessionId)

    override fun save(episode: Episode): Episode =
        episodeMongoRepository.save(EpisodeEntity.from(episode)).toDomain()
}
