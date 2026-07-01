package com.fixy.house.user.infrastructure.policy

import com.fixy.house.user.domain.PasswordVerifier
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

/**
 * 도메인 PasswordVerifier 의 BCrypt 구현.
 * 인프라 어노테이션이 있으므로 infrastructure 에 위치.
 */
@Component
class BcryptPasswordVerifier(
    private val passwordEncoder: PasswordEncoder
) : PasswordVerifier {
    override fun matches(plain: String, hashed: String): Boolean =
        passwordEncoder.matches(plain, hashed)
}

/** 해시 생성은 도메인 PasswordHasher 인터페이스를 통해 추상화. */
interface PasswordHasher {
    fun hash(plain: String): String
}

@Component
class BcryptPasswordHasher(
    private val passwordEncoder: PasswordEncoder
) : PasswordHasher {
    override fun hash(plain: String): String = passwordEncoder.encode(plain)
}
