package com.fixy.house.document.infrastructure.repository

import com.fixy.house.document.domain.Space
import com.fixy.house.document.domain.SpaceRepository
import com.fixy.house.document.infrastructure.entity.SpaceEntity
import org.springframework.stereotype.Repository

@Repository
class SpaceRepositoryImpl(
    private val spaceMongoRepository: SpaceMongoRepository
) : SpaceRepository {

    override fun findById(spaceId: String): Space? =
        spaceMongoRepository.findById(spaceId).orElse(null)?.toDomain()

    override fun findByTeamIdAndId(teamId: String, spaceId: String): Space? =
        spaceMongoRepository.findByTeamIdAndId(teamId, spaceId)?.toDomain()

    override fun findByTeamIdAndSlug(teamId: String, slug: String): Space? =
        spaceMongoRepository.findByTeamIdAndSlug(teamId, slug)?.toDomain()

    override fun findAllByTeamId(teamId: String): List<Space> =
        spaceMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun existsByTeamIdAndSlug(teamId: String, slug: String): Boolean =
        spaceMongoRepository.existsByTeamIdAndSlug(teamId, slug)

    override fun save(space: Space): Space =
        spaceMongoRepository.save(SpaceEntity.from(space)).toDomain()

    override fun delete(space: Space) {
        space.id?.let { spaceMongoRepository.deleteById(it) }
    }
}
