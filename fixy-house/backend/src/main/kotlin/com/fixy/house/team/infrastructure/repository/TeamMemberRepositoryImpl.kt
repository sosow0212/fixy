package com.fixy.house.team.infrastructure.repository

import com.fixy.house.team.domain.TeamMember
import com.fixy.house.team.domain.TeamMemberRepository
import com.fixy.house.team.domain.vo.TeamRole
import com.fixy.house.team.infrastructure.entity.TeamMemberEntity
import org.springframework.stereotype.Repository

@Repository
class TeamMemberRepositoryImpl(
    private val teamMemberMongoRepository: TeamMemberMongoRepository
) : TeamMemberRepository {

    override fun findById(memberId: String): TeamMember? =
        teamMemberMongoRepository.findById(memberId).orElse(null)?.toDomain()

    override fun findByTeamIdAndUserId(teamId: String, userId: String): TeamMember? =
        teamMemberMongoRepository.findByTeamIdAndUserId(teamId, userId)?.toDomain()

    override fun findAllByTeamId(teamId: String): List<TeamMember> =
        teamMemberMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun findAllByUserId(userId: String): List<TeamMember> =
        teamMemberMongoRepository.findAllByUserId(userId).map { it.toDomain() }

    override fun existsByTeamIdAndUserId(teamId: String, userId: String): Boolean =
        teamMemberMongoRepository.existsByTeamIdAndUserId(teamId, userId)

    override fun save(member: TeamMember): TeamMember =
        teamMemberMongoRepository.save(TeamMemberEntity.from(member)).toDomain()

    override fun delete(member: TeamMember) {
        member.id?.let { teamMemberMongoRepository.deleteById(it) }
    }

    override fun deleteByTeamIdAndUserId(teamId: String, userId: String) {
        teamMemberMongoRepository.deleteByTeamIdAndUserId(teamId, userId)
    }

    override fun countByTeamIdAndRoleIn(teamId: String, roles: List<TeamRole>): Long =
        teamMemberMongoRepository.countByTeamIdAndRoleIn(teamId, roles)
}
