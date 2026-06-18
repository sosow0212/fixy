package com.fixy.house.document.domain.vo

enum class TeamRole {
    OWNER,
    MANAGER,
    MEMBER;

    fun isAtLeastManager(): Boolean = this == OWNER || this == MANAGER
}
