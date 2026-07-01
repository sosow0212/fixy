package com.fixy.house.agent.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class AgentExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    AGENT_NOT_FOUND("AGENT_NOT_FOUND", "에이전트를 찾을 수 없습니다.", 404),
    AGENT_NAME_ALREADY_IN_USE("AGENT_NAME_ALREADY_IN_USE", "팀 내 이미 사용 중인 에이전트 이름입니다.", 409),
    AGENT_DISABLED("AGENT_DISABLED", "비활성화된 에이전트입니다.", 403),
    INVALID_AGENT_KEY("INVALID_AGENT_KEY", "에이전트 키가 유효하지 않습니다.", 401);
}
