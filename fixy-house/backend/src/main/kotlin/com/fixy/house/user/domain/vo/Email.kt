package com.fixy.house.user.domain.vo

import com.fixy.house.global.exceptions.CommonExceptionType
import com.fixy.house.global.exceptions.CustomException

@JvmInline
value class Email private constructor(val value: String) {
    init {
        require(value.length in 5..254) { "이메일 길이는 5~254자 여야 합니다." }
        require(EMAIL_REGEX.matches(value)) { "이메일 형식이 올바르지 않습니다." }
    }

    companion object {
        private val EMAIL_REGEX =
            Regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

        fun of(raw: String): Email {
            val normalized = raw.trim().lowercase()
            return runCatching { Email(normalized) }
                .getOrElse { throw CustomException(CommonExceptionType.BAD_REQUEST, "이메일 형식이 올바르지 않습니다.") }
        }
    }
}
