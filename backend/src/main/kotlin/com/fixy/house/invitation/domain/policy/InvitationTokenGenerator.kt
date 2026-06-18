package com.fixy.house.invitation.domain.policy

interface InvitationTokenGenerator {
    fun generateRawToken(): String
    fun hashToken(raw: String): String
}
