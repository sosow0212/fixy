package com.fixy.house.user.domain.vo

import com.fixy.house.global.exceptions.CommonExceptionType
import com.fixy.house.global.exceptions.CustomException

@JvmInline
value class RawPassword private constructor(val value: String) {
    init {
        require(value.length in 8..64) { "비밀번호는 8자 이상 64자 이하 여야 합니다." }
        require(value.any { it.isDigit() }) { "비밀번호는 숫자를 최소 1개 포함해야 합니다." }
        require(value.any { it.isLetter() }) { "비밀번호는 영문을 최소 1개 포함해야 합니다." }
    }

    companion object {
        fun of(raw: String): RawPassword =
            runCatching { RawPassword(raw) }
                .getOrElse { throw CustomException(CommonExceptionType.BAD_REQUEST, it.message ?: "비밀번호가 유효하지 않습니다.") }
    }
}
