package com.fixy.house.team.infrastructure.repository

import com.fixy.house.team.domain.Team
import com.fixy.house.team.domain.TeamRepository
import com.fixy.house.team.infrastructure.entity.TeamEntity
import org.springframework.stereotype.Repository

@Repository
class TeamRepositoryImpl(
    private val teamMongoRepository: TeamMongoRepository
) : TeamRepository {

    override fun findById(teamId: String): Team? =
        teamMongoRepository.findById(teamId).orElse(null)?.toDomain()

    override fun findBySlug(slug: String): Team? =
        teamMongoRepository.findBySlug(slug)?.toDomain()

    override fun existsBySlug(slug: String): Boolean =
        teamMongoRepository.existsBySlug(slug)

    override fun save(team: Team): Team =
        teamMongoRepository.save(TeamEntity.from(team)).toDomain()

    override fun delete(team: Team) {
        team.id?.let { teamMongoRepository.deleteById(it) }
    }
}
