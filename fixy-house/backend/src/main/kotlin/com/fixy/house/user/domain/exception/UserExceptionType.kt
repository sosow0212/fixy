package com.fixy.house.user.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class UserExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    USER_NOT_FOUND("USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", 404),
    EMAIL_ALREADY_IN_USE("EMAIL_ALREADY_IN_USE", "이미 사용 중인 이메일입니다.", 409),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.", 401),
    INVALID_REFRESH_TOKEN("INVALID_REFRESH_TOKEN", "리프레시 토큰이 유효하지 않거나 만료되었습니다.", 401);
}
