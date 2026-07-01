package com.fixy.house.global.exceptions

/**
 * 모든 도메인 예외 타입이 구현해야 하는 계약.
 *
 * - errorCode     : 클라이언트/모니터링에서 식별하는 안정적인 코드
 * - message       : 사람/로컬라이즈에 사용되는 기본 메시지
 * - httpStatusCode: HTTP 응답 코드
 */
interface CustomExceptionType {
    val errorCode: String
    val message: String
    val httpStatusCode: Int
}
