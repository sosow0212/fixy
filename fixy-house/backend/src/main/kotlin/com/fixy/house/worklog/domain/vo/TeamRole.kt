package com.fixy.house.worklog.domain.vo

enum class TeamRole {
    OWNER,
    MANAGER,
    MEMBER;

    fun isAtLeastManager(): Boolean = this == OWNER || this == MANAGER

    fun isAtLeastMember(): Boolean = true
}
