package com.fixy.house.global.exceptions

/**
 * 비즈니스 로직에서 던지는 단일 예외.
 *
 * 사용 예:
 * ```
 * throw CustomException(UserExceptionType.USER_NOT_FOUND)
 * throw CustomException(CommonExceptionType.NOT_FOUND, "해당 팀을 찾을 수 없습니다.")
 * ```
 */
open class CustomException(
    private val customExceptionType: CustomExceptionType,
    private val overrideMessage: String? = null
) : RuntimeException(
    "[${customExceptionType.errorCode}]: ${overrideMessage ?: customExceptionType.message}"
) {

    fun getExceptionType(): CustomExceptionType = customExceptionType

    override val message: String
        get() = overrideMessage ?: customExceptionType.message
}
