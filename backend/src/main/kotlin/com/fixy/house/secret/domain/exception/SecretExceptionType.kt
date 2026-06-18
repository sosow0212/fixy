package com.fixy.house.secret.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class SecretExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    SECRET_NOT_FOUND("SECRET_NOT_FOUND", "시크릿을 찾을 수 없습니다.", 404),
    SECRET_FORBIDDEN("SECRET_FORBIDDEN", "해당 시크릿에 접근할 권한이 없습니다.", 403),
    SECRET_KEY_DUPLICATE("SECRET_KEY_DUPLICATE", "이미 동일한 (key, scope) 시크릿이 존재합니다.", 409),
    DECRYPTION_FAILED("DECRYPTION_FAILED", "시크릿 복호화에 실패했습니다.", 500)
}
