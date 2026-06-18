package com.fixy.house.document.domain

interface SpaceRepository {
    fun findById(spaceId: String): Space?
    fun findByTeamIdAndId(teamId: String, spaceId: String): Space?
    fun findByTeamIdAndSlug(teamId: String, slug: String): Space?
    fun findAllByTeamId(teamId: String): List<Space>
    fun existsByTeamIdAndSlug(teamId: String, slug: String): Boolean
    fun save(space: Space): Space
    fun delete(space: Space)
}
