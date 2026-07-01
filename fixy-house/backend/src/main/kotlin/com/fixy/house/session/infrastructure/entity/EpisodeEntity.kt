package com.fixy.house.session.infrastructure.entity

import com.fixy.house.session.domain.Episode
import com.fixy.house.session.domain.vo.Signal
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "session_episodes")
@CompoundIndexes(
    CompoundIndex(name = "agent_episodeId_unique", def = "{'agent_id': 1, 'episode_id': 1}", unique = true)
)
class EpisodeEntity(
    @Id
    var id: String? = null,

    @Field(name = "episode_id")
    var episodeId: String,

    @Indexed
    @Field(name = "session_id")
    var sessionId: String,

    @Field(name = "agent_id")
    var agentId: String,

    @Indexed
    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "ts")
    var ts: Instant,

    @Field(name = "signal")
    var signal: Signal,

    @Field(name = "summary")
    var summary: String,

    @Field(name = "tags")
    var tags: List<String> = emptyList(),

    @Field(name = "files")
    var files: List<String> = emptyList(),

    @Field(name = "project_name")
    var projectName: String? = null,

    @Field(name = "promoted_to")
    var promotedTo: String? = null
) {

    fun toDomain(): Episode = Episode(
        id = id,
        episodeId = episodeId,
        sessionId = sessionId,
        agentId = agentId,
        teamId = teamId,
        ts = ts,
        signal = signal,
        summary = summary,
        tags = tags,
        files = files,
        projectName = projectName,
        promotedTo = promotedTo
    )

    companion object {
        fun from(domain: Episode): EpisodeEntity = EpisodeEntity(
            id = domain.id,
            episodeId = domain.episodeId,
            sessionId = domain.sessionId,
            agentId = domain.agentId,
            teamId = domain.teamId,
            ts = domain.ts,
            signal = domain.signal,
            summary = domain.summary,
            tags = domain.tags,
            files = domain.files,
            projectName = domain.projectName,
            promotedTo = domain.promotedTo
        )
    }
}
