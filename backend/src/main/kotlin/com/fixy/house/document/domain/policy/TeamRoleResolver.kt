package com.fixy.house.document.domain.policy

import com.fixy.house.document.domain.vo.TeamRole

interface TeamRoleResolver {
    fun resolveRole(userId: String, teamId: String): TeamRole?
}
