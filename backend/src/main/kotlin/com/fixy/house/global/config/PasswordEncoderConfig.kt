package com.fixy.house.global.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration
class PasswordEncoderConfig {

    /**
     * 사용자 비밀번호 / 에이전트 키 해시용.
     * strength=12 — 약 250ms / hash (2025 기준) — 운영 트래픽에 맞춰 조정.
     */
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder(12)
}
