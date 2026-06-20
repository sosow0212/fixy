package com.fixy.house.worklog.infrastructure.policy

import com.fixy.house.team.infrastructure.repository.TeamMemberMongoRepository
import com.fixy.house.worklog.domain.policy.TeamRoleResolver
import com.fixy.house.worklog.domain.vo.TeamRole
import org.springframework.stereotype.Component

@Component("worklogTeamRoleResolver")
class DefaultTeamRoleResolver(
    private val teamMemberMongoRepository: TeamMemberMongoRepository
) : TeamRoleResolver {
    override fun resolveRole(userId: String, teamId: String): TeamRole? {
        if (userId.isBlank() || teamId.isBlank()) return null
        val teamRole = teamMemberMongoRepository.findByTeamIdAndUserId(teamId, userId)?.role
            ?: return null
        return runCatching { TeamRole.valueOf(teamRole.name) }.getOrNull()
    }
}
