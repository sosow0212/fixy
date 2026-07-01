package com.fixy.house.agent.domain.vo

enum class AgentStatus {
    ACTIVE,
    DISABLED;

    companion object {
        fun fromStringOrActive(value: String?): AgentStatus =
            value?.let { name -> entries.firstOrNull { it.name.equals(name, ignoreCase = true) } } ?: ACTIVE
    }
}
