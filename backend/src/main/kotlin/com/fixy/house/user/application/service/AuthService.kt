package com.fixy.house.user.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.global.security.JwtProvider
import com.fixy.house.user.application.dto.response.TokenResponse
import com.fixy.house.user.domain.User
import com.fixy.house.user.domain.UserRepository
import com.fixy.house.user.domain.exception.UserExceptionType
import com.fixy.house.user.domain.vo.DisplayName
import com.fixy.house.user.domain.vo.Email
import com.fixy.house.user.domain.vo.RawPassword
import com.fixy.house.user.infrastructure.policy.PasswordHasher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordHasher: PasswordHasher,
    private val jwtProvider: JwtProvider
) {

    @Transactional
    fun signUp(rawEmail: String, rawPassword: String, rawDisplayName: String): TokenResponse {
        val email = Email.of(rawEmail)
        if (userRepository.existsByEmail(email.value)) {
            throw CustomException(UserExceptionType.EMAIL_ALREADY_IN_USE)
        }
        val hashed = passwordHasher.hash(RawPassword.of(rawPassword).value)
        val displayName = DisplayName.of(rawDisplayName)
        val saved = userRepository.save(User.create(email, hashed, displayName))
        return issueTokens(saved)
    }

    @Transactional
    fun login(rawEmail: String, rawPassword: String): TokenResponse {
        val user = userRepository.findByEmail(Email.of(rawEmail).value)
            ?: throw CustomException(UserExceptionType.INVALID_CREDENTIALS)
        if (!user.isPasswordMatch(rawPassword, BcryptPasswordVerifierShim.delegate)) {
            throw CustomException(UserExceptionType.INVALID_CREDENTIALS)
        }
        return issueTokens(user)
    }

    @Transactional
    fun refresh(refreshToken: String): TokenResponse {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw CustomException(UserExceptionType.INVALID_REFRESH_TOKEN)
        }
        val userId = jwtProvider.getSubjectAsUserId(refreshToken)
        val user = userRepository.findById(userId)
            ?: throw CustomException(UserExceptionType.USER_NOT_FOUND)
        return issueTokens(user)
    }

    private fun issueTokens(user: User): TokenResponse {
        val userId = user.id ?: error("저장된 사용자만 토큰을 발급할 수 있습니다.")
        val accessToken = jwtProvider.generateAccessToken(userId, user.role)
        val refreshToken = jwtProvider.generateRefreshToken(userId)
        user.updateLastLoginTime()
        userRepository.save(user)
        val now = Instant.now()
        return TokenResponse(
            grantType = "Bearer",
            accessToken = accessToken,
            accessTokenExpiresAt = now.plusSeconds(jwtProvider.accessTokenTtlSeconds),
            refreshToken = refreshToken,
            refreshTokenExpiresAt = now.plusSeconds(jwtProvider.refreshTokenTtlSeconds)
        )
    }
}

/**
 * User.isPasswordMatch 가 도메인 service 인터페이스를 받지만,
 * application 계층에서 BCrypt 의존을 피하기 위해 래퍼를 둔다.
 *
 * (혹은 PasswordVerifier 를 @Component 로 등록하고 그대로 주입받아도 됨 — 동일 효과.)
 */
private object BcryptPasswordVerifierShim {
    val delegate: com.fixy.house.user.domain.PasswordVerifier = object :
        com.fixy.house.user.domain.PasswordVerifier {
        override fun matches(plain: String, hashed: String): Boolean =
            // 평문 매칭은 Spring Security 의 PasswordEncoder 를 사용.
            // application 계층의 의존성을 끊기 위해 여기서 직접 BCrypt 호출.
            org.springframework.security.crypto.bcrypt.BCrypt.checkpw(plain, hashed)
    }
}
