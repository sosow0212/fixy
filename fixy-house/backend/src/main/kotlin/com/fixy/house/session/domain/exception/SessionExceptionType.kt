package com.fixy.house.session.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class SessionExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    SESSION_NOT_FOUND("SESSION_NOT_FOUND", "세션을 찾을 수 없습니다.", 404),
    SESSION_FORBIDDEN("SESSION_FORBIDDEN", "해당 에이전트의 세션이 아닙니다.", 403),
    SESSION_ALREADY_ENDED("SESSION_ALREADY_ENDED", "이미 종료된 세션입니다.", 409),
    AGENT_TEAM_MISMATCH("AGENT_TEAM_MISMATCH", "에이전트와 세션의 팀이 일치하지 않습니다.", 409),
    MESSAGE_NOT_FOUND("MESSAGE_NOT_FOUND", "메시지를 찾을 수 없습니다.", 404),
    TOOL_CALL_NOT_FOUND("TOOL_CALL_NOT_FOUND", "툴 호출을 찾을 수 없습니다.", 404),
    EPISODE_NOT_FOUND("EPISODE_NOT_FOUND", "에피소드를 찾을 수 없습니다.", 404),
    INVALID_SESSION_STATE("INVALID_SESSION_STATE", "세션 상태가 요청을 허용하지 않습니다.", 409);
}
