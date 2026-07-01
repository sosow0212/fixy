package com.fixy.house.invitation.domain.vo

enum class InvitationStatus {
    PENDING,
    ACCEPTED,
    REVOKED,
    EXPIRED;

    companion object {
        fun fromStringOrPending(value: String?): InvitationStatus =
            value?.let { name -> entries.firstOrNull { it.name.equals(name, ignoreCase = true) } } ?: PENDING
    }
}
