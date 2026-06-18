package com.fixy.house.team.domain

import com.fixy.house.team.domain.vo.TeamRole

interface TeamMemberRepository {
    fun findById(memberId: String): TeamMember?
    fun findByTeamIdAndUserId(teamId: String, userId: String): TeamMember?
    fun findAllByTeamId(teamId: String): List<TeamMember>
    fun findAllByUserId(userId: String): List<TeamMember>
    fun existsByTeamIdAndUserId(teamId: String, userId: String): Boolean
    fun save(member: TeamMember): TeamMember
    fun delete(member: TeamMember)
    fun deleteByTeamIdAndUserId(teamId: String, userId: String)
    fun countByTeamIdAndRoleIn(teamId: String, roles: List<TeamRole>): Long
}
