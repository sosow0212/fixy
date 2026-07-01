package com.fixy.house.global.security

/**
 * 인증된 사용자 주입 마커.
 *
 * 사용 예:
 * ```
 * fun getMyInfo(@AuthUser userId: String): UserSummaryResponse { ... }
 * ```
 *
 * Mongo ObjectId 를 String 으로 다루므로 userId 타입은 String.
 */
@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
annotation class AuthUser
