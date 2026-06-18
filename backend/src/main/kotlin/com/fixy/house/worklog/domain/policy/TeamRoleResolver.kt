package com.fixy.house.worklog.domain.policy

import com.fixy.house.worklog.domain.vo.TeamRole

interface TeamRoleResolver {
    fun resolveRole(userId: String, teamId: String): TeamRole?
}
