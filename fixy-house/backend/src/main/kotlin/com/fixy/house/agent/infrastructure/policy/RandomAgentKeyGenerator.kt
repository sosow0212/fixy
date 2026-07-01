package com.fixy.house.agent.infrastructure.policy

import com.fixy.house.agent.domain.policy.AgentKeyGenerator
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.Base64

@Component
class RandomAgentKeyGenerator : AgentKeyGenerator {

    private val secureRandom = SecureRandom()

    override fun generateRawKey(): String {
        val bytes = ByteArray(RANDOM_BYTES)
        secureRandom.nextBytes(bytes)
        val encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
        return "$KEY_PREFIX$encoded"
    }

    override fun lastFourOf(raw: String): String = raw.takeLast(LAST_FOUR_LENGTH)

    companion object {
        private const val RANDOM_BYTES = 40
        private const val LAST_FOUR_LENGTH = 4
        private const val KEY_PREFIX = "fixy_"
    }
}
