package com.fixy.house.user.domain

import com.fixy.house.global.BaseEntity
import com.fixy.house.user.domain.vo.DisplayName
import com.fixy.house.user.domain.vo.Email
import com.fixy.house.user.domain.vo.UserRole
import java.time.Instant

/**
 * 사용자 도메인 POJO. 인프라 의존성 없음.
 *
 * 검증: init { } — 생성 시점
 * 변이: 도메인 메서드 — 상태 천이 표현
 *
 * 영속화 시 UserEntity 와 1:1 매핑된다 (UserEntityMapper).
 */
class User(
    var id: String? = null,
    var email: String,
    var passwordHash: String,
    var displayName: String,
    var role: UserRole = UserRole.USER,
    var lastLoginAt: Instant? = null
) : BaseEntity() {

    init {
        Email.of(email)
        DisplayName.of(displayName)
        require(passwordHash.isNotBlank()) { "비밀번호 해시는 비어 있을 수 없습니다." }
    }

    fun updateLastLoginTime(now: Instant = Instant.now()) {
        this.lastLoginAt = now
    }

    fun updateDisplayName(rawDisplayName: String) {
        this.displayName = DisplayName.of(rawDisplayName).value
    }

    fun changePassword(newPasswordHash: String) {
        require(newPasswordHash.isNotBlank()) { "새 비밀번호 해시는 비어 있을 수 없습니다." }
        this.passwordHash = newPasswordHash
    }

    fun changeRole(newRole: UserRole) {
        this.role = newRole
    }

    fun isPasswordMatch(plainPassword: String, policy: PasswordVerifier): Boolean =
        policy.matches(plainPassword, this.passwordHash)

    companion object {
        fun create(
            email: Email,
            passwordHash: String,
            displayName: DisplayName
        ): User = User(
            email = email.value,
            passwordHash = passwordHash,
            displayName = displayName.value
        )
    }
}

/** 비밀번호 검증 도메인 서비스 인터페이스. 구현은 infrastructure.policy. */
interface PasswordVerifier {
    fun matches(plain: String, hashed: String): Boolean
}
