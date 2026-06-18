package com.fixy.house.user.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.user.application.dto.response.UserSummaryResponse
import com.fixy.house.user.domain.PasswordVerifier
import com.fixy.house.user.domain.User
import com.fixy.house.user.domain.UserRepository
import com.fixy.house.user.domain.exception.UserExceptionType
import com.fixy.house.user.infrastructure.policy.PasswordHasher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val passwordHasher: PasswordHasher,
    private val passwordVerifier: PasswordVerifier
) {

    @Transactional(readOnly = true)
    fun getMyInfo(userId: String): UserSummaryResponse =
        UserSummaryResponse.from(findUserById(userId))

    @Transactional
    fun updateDisplayName(userId: String, newDisplayName: String): UserSummaryResponse {
        val user = findUserById(userId)
        user.updateDisplayName(newDisplayName)
        return UserSummaryResponse.from(userRepository.save(user))
    }

    @Transactional
    fun changePassword(userId: String, currentPassword: String, newPassword: String) {
        val user = findUserById(userId)
        if (!user.isPasswordMatch(currentPassword, passwordVerifier)) {
            throw CustomException(UserExceptionType.INVALID_CREDENTIALS)
        }
        user.changePassword(passwordHasher.hash(newPassword))
        userRepository.save(user)
    }

    @Transactional
    fun updateLastLogin(userId: String) {
        val user = findUserById(userId)
        user.updateLastLoginTime()
        userRepository.save(user)
    }

    private fun findUserById(userId: String): User =
        userRepository.findById(userId)
            ?: throw CustomException(UserExceptionType.USER_NOT_FOUND)
}
