package com.fixy.house.team.domain

interface TeamRepository {
    fun findById(teamId: String): Team?
    fun findBySlug(slug: String): Team?
    fun existsBySlug(slug: String): Boolean
    fun save(team: Team): Team
    fun delete(team: Team)
}
