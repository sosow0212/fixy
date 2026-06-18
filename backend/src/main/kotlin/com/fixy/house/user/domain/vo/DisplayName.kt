package com.fixy.house.user.domain.vo

import com.fixy.house.global.exceptions.CommonExceptionType
import com.fixy.house.global.exceptions.CustomException

@JvmInline
value class DisplayName private constructor(val value: String) {
    init {
        require(value.length in 2..30) { "표시 이름은 2자 이상 30자 이하 여야 합니다." }
    }

    companion object {
        fun of(raw: String): DisplayName =
            runCatching { DisplayName(raw.trim()) }
                .getOrElse { throw CustomException(CommonExceptionType.BAD_REQUEST, it.message ?: "표시 이름이 유효하지 않습니다.") }
    }
}
