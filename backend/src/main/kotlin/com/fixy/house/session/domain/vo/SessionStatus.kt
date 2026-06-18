package com.fixy.house.session.domain.vo

enum class SessionStatus {
    ACTIVE,
    IDLE,
    COMPLETED,
    FAILED;

    val isTerminal: Boolean get() = this == COMPLETED || this == FAILED
}
