package com.fixy.house.global.exceptions

/**
 * 세부 도메인 예외가 필요 없을 때 쓰는 공통 HTTP 예외 타입.
 *
 * 특정 도메인(예: User, Team) 에 종속된 에러라면
 * 해당 도메인의 ExceptionType(UserExceptionType 등) 을 별도로 정의해서 쓸 것.
 */
enum class CommonExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {

    BAD_REQUEST(
        "BAD_REQUEST",
        "잘못된 요청입니다.",
        400
    ),

    UNAUTHORIZED(
        "UNAUTHORIZED",
        "인증이 필요합니다.",
        401
    ),

    FORBIDDEN(
        "FORBIDDEN",
        "접근 권한이 없습니다.",
        403
    ),

    NOT_FOUND(
        "NOT_FOUND",
        "요청한 리소스를 찾을 수 없습니다.",
        404
    ),

    CONFLICT(
        "CONFLICT",
        "요청이 현재 상태와 충돌합니다.",
        409
    ),

    UNPROCESSABLE_ENTITY(
        "UNPROCESSABLE_ENTITY",
        "요청을 처리할 수 없습니다.",
        422
    ),

    INTERNAL_SERVER_ERROR(
        "INTERNAL_SERVER_ERROR",
        "서버 내부 오류가 발생했습니다.",
        500
    );
}
