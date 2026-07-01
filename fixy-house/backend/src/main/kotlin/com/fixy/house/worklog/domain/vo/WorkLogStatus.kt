package com.fixy.house.worklog.domain.vo

enum class WorkLogStatus {
    TODO,
    IN_PROGRESS,
    DONE,
    BLOCKED;

    fun isTerminal(): Boolean = this == DONE
}
