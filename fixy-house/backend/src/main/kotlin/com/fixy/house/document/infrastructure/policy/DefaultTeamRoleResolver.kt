package com.fixy.house.document.infrastructure.policy

import com.fixy.house.document.domain.policy.TeamRoleResolver
import com.fixy.house.document.domain.vo.TeamRole
import com.fixy.house.team.infrastructure.repository.TeamMemberMongoRepository
import org.springframework.stereotype.Component

@Component("documentTeamRoleResolver")
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
