package com.fixy.house.document.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class DocumentExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    SPACE_NOT_FOUND("SPACE_NOT_FOUND", "문서 공간을 찾을 수 없습니다.", 404),
    SPACE_SLUG_ALREADY_IN_USE("SPACE_SLUG_ALREADY_IN_USE", "이미 사용 중인 슬러그입니다.", 409),
    PAGE_NOT_FOUND("PAGE_NOT_FOUND", "문서 페이지를 찾을 수 없습니다.", 404),
    PAGE_FORBIDDEN("PAGE_FORBIDDEN", "해당 문서에 접근할 권한이 없습니다.", 403),
    PARENT_PAGE_MISMATCH("PARENT_PAGE_MISMATCH", "상위 페이지가 같은 스페이스에 속하지 않습니다.", 409)
}
