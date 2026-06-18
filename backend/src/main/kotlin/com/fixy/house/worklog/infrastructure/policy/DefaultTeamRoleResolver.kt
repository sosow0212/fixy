package com.fixy.house.worklog.infrastructure.policy

import com.fixy.house.worklog.domain.policy.TeamRoleResolver
import com.fixy.house.worklog.domain.vo.TeamRole
import org.springframework.stereotype.Component

/**
 * team 도메인 구현이 추가되면 교체될 플레이스홀더.
 * 현재는 모든 멤버를 MEMBER 로 간주한다.
 */
@Component("worklogTeamRoleResolver")
class DefaultTeamRoleResolver : TeamRoleResolver {
    override fun resolveRole(userId: String, teamId: String): TeamRole? {
        if (userId.isBlank() || teamId.isBlank()) return null
        return TeamRole.MEMBER
    }
}
