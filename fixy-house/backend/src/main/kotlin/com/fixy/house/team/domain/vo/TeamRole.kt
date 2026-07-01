package com.fixy.house.team.domain.vo

enum class TeamRole {
    OWNER,
    MANAGER,
    MEMBER;

    fun isAtLeast(target: TeamRole): Boolean = this.ordinal <= target.ordinal

    companion object {
        fun fromStringOrMember(value: String?): TeamRole =
            value?.let { name -> entries.firstOrNull { it.name.equals(name, ignoreCase = true) } } ?: MEMBER
    }
}
