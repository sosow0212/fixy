package com.fixy.house.agent.domain.policy

interface AgentKeyGenerator {
    fun generateRawKey(): String
    fun lastFourOf(raw: String): String
}
