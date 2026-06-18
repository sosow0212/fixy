package com.fixy.house.global.security

/**
 * 에이전트(서비스 계정) 의 주입 마커.
 *
 * 사용 예:
 * ```
 * fun startSession(@AgentId agentId: String, @RequestBody request: StartSessionRequest) { ... }
 * ```
 */
@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
annotation class AgentId
