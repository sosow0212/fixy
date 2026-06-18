package com.fixy.house.team.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.team.application.dto.request.CreateTeamRequest
import com.fixy.house.team.application.dto.request.UpdateTeamRequest
import com.fixy.house.team.application.dto.response.TeamMemberResponse
import com.fixy.house.team.application.dto.response.TeamSummaryResponse
import com.fixy.house.team.domain.Team
import com.fixy.house.team.domain.TeamMember
import com.fixy.house.team.domain.TeamMemberRepository
import com.fixy.house.team.domain.TeamRepository
import com.fixy.house.team.domain.exception.TeamExceptionType
import com.fixy.house.team.domain.vo.TeamRole
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TeamService(
    private val teamRepository: TeamRepository,
    private val teamMemberRepository: TeamMemberRepository
) {

    @Transactional
    fun createTeam(actorUserId: String, request: CreateTeamRequest): TeamSummaryResponse {
        val slug = resolveSlug(request.slug ?: request.name)
        if (teamRepository.existsBySlug(slug)) {
            throw CustomException(TeamExceptionType.TEAM_SLUG_ALREADY_IN_USE)
        }
        val team = teamRepository.save(
            Team(
                name = request.name,
                slug = slug,
                ownerUserId = actorUserId,
                description = request.description
            )
        )
        val teamId = team.id ?: error("저장된 팀의 ID가 없습니다.")
        teamMemberRepository.save(
            TeamMember(
                teamId = teamId,
                userId = actorUserId,
                role = TeamRole.OWNER
            )
        )
        return TeamSummaryResponse.from(team, TeamRole.OWNER)
    }

    @Transactional(readOnly = true)
    fun getMyTeams(actorUserId: String): List<TeamSummaryResponse> =
        teamMemberRepository.findAllByUserId(actorUserId)
            .mapNotNull { member ->
                val team = teamRepository.findById(member.teamId) ?: return@mapNotNull null
                TeamSummaryResponse.from(team, member.role)
            }
            .sortedByDescending { it.createdAt }

    @Transactional(readOnly = true)
    fun getTeam(actorUserId: String, teamId: String): TeamSummaryResponse {
        val team = findTeamById(teamId)
        val role = requireMember(actorUserId, teamId)
        return TeamSummaryResponse.from(team, role)
    }

    @Transactional
    fun updateTeam(
        actorUserId: String,
        teamId: String,
        request: UpdateTeamRequest
    ): TeamSummaryResponse {
        val team = findTeamById(teamId)
        requireRoleAtLeast(actorUserId, teamId, TeamRole.MANAGER)
        request.name?.let { team.rename(it) }
        if (request.description != null) {
            team.updateDescription(request.description)
        }
        val saved = teamRepository.save(team)
        return TeamSummaryResponse.from(saved, findMyRole(actorUserId, teamId))
    }

    @Transactional
    fun deleteTeam(actorUserId: String, teamId: String) {
        findTeamById(teamId)
        requireRoleAtLeast(actorUserId, teamId, TeamRole.OWNER)
        teamMemberRepository.findAllByTeamId(teamId).forEach { teamMemberRepository.delete(it) }
        teamRepository.findById(teamId)?.let { teamRepository.delete(it) }
    }

    @Transactional(readOnly = true)
    fun getMembers(actorUserId: String, teamId: String): List<TeamMemberResponse> {
        requireMember(actorUserId, teamId)
        return teamMemberRepository.findAllByTeamId(teamId)
            .map { TeamMemberResponse.from(it) }
            .sortedBy { it.joinedAt }
    }

    @Transactional
    fun changeMemberRole(
        actorUserId: String,
        teamId: String,
        targetUserId: String,
        newRole: TeamRole
    ): TeamMemberResponse {
        val team = findTeamById(teamId)
        requireRoleAtLeast(actorUserId, teamId, TeamRole.MANAGER)
        val target = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
            ?: throw CustomException(TeamExceptionType.TEAM_MEMBER_NOT_FOUND)

        val isOldOwner = target.role == TeamRole.OWNER
        val isNewOwner = newRole == TeamRole.OWNER

        if (isOldOwner && !isNewOwner) {
            val ownerCount = teamMemberRepository.countByTeamIdAndRoleIn(teamId, listOf(TeamRole.OWNER))
            if (ownerCount <= 1L) {
                throw CustomException(TeamExceptionType.CANNOT_DEMOTE_LAST_OWNER)
            }
        }

        target.changeRole(newRole)
        val saved = teamMemberRepository.save(target)

        if (isNewOwner && !isOldOwner) {
            team.transferOwnership(targetUserId)
            teamRepository.save(team)
        }

        return TeamMemberResponse.from(saved)
    }

    @Transactional
    fun removeMember(actorUserId: String, teamId: String, targetUserId: String) {
        findTeamById(teamId)
        requireRoleAtLeast(actorUserId, teamId, TeamRole.MANAGER)
        val target = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
            ?: throw CustomException(TeamExceptionType.TEAM_MEMBER_NOT_FOUND)
        if (target.role == TeamRole.OWNER) {
            val ownerCount = teamMemberRepository.countByTeamIdAndRoleIn(teamId, listOf(TeamRole.OWNER))
            if (ownerCount <= 1L) {
                throw CustomException(TeamExceptionType.CANNOT_REMOVE_OWN_OWNERSHIP)
            }
        }
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, targetUserId)
    }

    fun findTeamById(teamId: String): Team =
        teamRepository.findById(teamId) ?: throw CustomException(TeamExceptionType.TEAM_NOT_FOUND)

    fun requireMember(actorUserId: String, teamId: String): TeamRole =
        findMyRole(actorUserId, teamId)
            ?: throw CustomException(TeamExceptionType.NOT_TEAM_MEMBER)

    fun findMyRole(actorUserId: String, teamId: String): TeamRole? =
        teamMemberRepository.findByTeamIdAndUserId(teamId, actorUserId)?.role

    fun requireRoleAtLeast(actorUserId: String, teamId: String, targetRole: TeamRole) {
        val actorRole = findMyRole(actorUserId, teamId)
            ?: throw CustomException(TeamExceptionType.NOT_TEAM_MEMBER)
        if (!actorRole.isAtLeast(targetRole)) {
            throw CustomException(TeamExceptionType.INSUFFICIENT_TEAM_ROLE)
        }
    }

    private fun resolveSlug(input: String): String {
        val raw = input.trim().lowercase()
            .replace(Regex("[^a-z0-9]+"), "-")
            .trim('-')
        require(raw.length in 2..40) { "슬러그로 변환할 수 없는 이름입니다." }
        return raw
    }
}
