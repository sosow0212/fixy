package com.fixy.house.team.domain

import com.fixy.house.global.BaseEntity
import com.fixy.house.team.domain.vo.TeamRole
import java.time.Instant

class TeamMember(
    var id: String? = null,
    var teamId: String,
    var userId: String,
    var role: TeamRole,
    var joinedAt: Instant = Instant.now()
) : BaseEntity() {

    init {
        require(teamId.isNotBlank()) { "팀 ID는 비어 있을 수 없습니다." }
        require(userId.isNotBlank()) { "사용자 ID는 비어 있을 수 없습니다." }
    }

    fun changeRole(newRole: TeamRole) {
        this.role = newRole
    }
}
