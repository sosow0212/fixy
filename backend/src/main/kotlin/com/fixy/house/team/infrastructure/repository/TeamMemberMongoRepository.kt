package com.fixy.house.team.infrastructure.repository

import com.fixy.house.team.domain.vo.TeamRole
import com.fixy.house.team.infrastructure.entity.TeamMemberEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface TeamMemberMongoRepository : MongoRepository<TeamMemberEntity, String> {
    fun findByTeamIdAndUserId(teamId: String, userId: String): TeamMemberEntity?
    fun findAllByTeamId(teamId: String): List<TeamMemberEntity>
    fun findAllByUserId(userId: String): List<TeamMemberEntity>
    fun existsByTeamIdAndUserId(teamId: String, userId: String): Boolean
    fun deleteByTeamIdAndUserId(teamId: String, userId: String)
    fun countByTeamIdAndRoleIn(teamId: String, roles: List<TeamRole>): Long
}
