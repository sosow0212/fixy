package com.fixy.house.document.infrastructure.policy

import com.fixy.house.document.domain.policy.TeamRoleResolver
import com.fixy.house.document.domain.vo.TeamRole
import org.springframework.stereotype.Component

@Component("documentTeamRoleResolver")
class DefaultTeamRoleResolver : TeamRoleResolver {
    override fun resolveRole(userId: String, teamId: String): TeamRole? {
        if (userId.isBlank() || teamId.isBlank()) return null
        return TeamRole.MEMBER
    }
}
