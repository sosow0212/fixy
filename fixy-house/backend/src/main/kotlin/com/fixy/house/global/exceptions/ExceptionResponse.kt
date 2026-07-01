package com.fixy.house.global.exceptions

/**
 * 모든 예외 응답의 단일 모양.
 *
 * - name     : 예외 클래스/타입 이름 (디버깅용)
 * - errorCode: 클라이언트 분기용 안정 코드
 * - message  : 사람/로컬라이즈용 메시지
 */
data class ExceptionResponse(
    val name: String,
    val errorCode: String,
    val message: String,
)
