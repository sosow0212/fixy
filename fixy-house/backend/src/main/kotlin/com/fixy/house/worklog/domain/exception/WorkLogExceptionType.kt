package com.fixy.house.worklog.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class WorkLogExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    WORK_LOG_NOT_FOUND("WORK_LOG_NOT_FOUND", "작업 로그를 찾을 수 없습니다.", 404),
    WORK_LOG_FORBIDDEN("WORK_LOG_FORBIDDEN", "해당 작업 로그에 접근할 권한이 없습니다.", 403),
    PARENT_WORK_LOG_NOT_FOUND("PARENT_WORK_LOG_NOT_FOUND", "상위 작업 로그를 찾을 수 없습니다.", 404),
    PARENT_WORK_LOG_MISMATCH("PARENT_WORK_LOG_MISMATCH", "상위 작업 로그가 같은 팀에 속하지 않습니다.", 409)
}
