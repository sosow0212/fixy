package com.fixy.house.session.domain.vo

enum class Signal {
    COMPLAINT,
    CORRECTION,
    INSIGHT,
    SUCCESS,
    NOTE;

    companion object {
        fun fromAgentSignal(value: String?): Signal {
            if (value == null) return NOTE
            val normalized = value.trim().uppercase()
            return entries.firstOrNull { it.name == normalized } ?: NOTE
        }
    }
}
