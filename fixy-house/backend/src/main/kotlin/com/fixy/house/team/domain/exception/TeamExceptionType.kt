package com.fixy.house.team.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class TeamExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    TEAM_NOT_FOUND("TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.", 404),
    TEAM_SLUG_ALREADY_IN_USE("TEAM_SLUG_ALREADY_IN_USE", "이미 사용 중인 슬러그입니다.", 409),
    NOT_TEAM_MEMBER("NOT_TEAM_MEMBER", "팀 멤버가 아닙니다.", 403),
    TEAM_MEMBER_NOT_FOUND("TEAM_MEMBER_NOT_FOUND", "팀 멤버를 찾을 수 없습니다.", 404),
    MEMBER_ALREADY_EXISTS("MEMBER_ALREADY_EXISTS", "이미 팀에 속한 멤버입니다.", 409),
    INSUFFICIENT_TEAM_ROLE("INSUFFICIENT_TEAM_ROLE", "팀 권한이 부족합니다.", 403),
    CANNOT_REMOVE_OWN_OWNERSHIP("CANNOT_REMOVE_OWN_OWNERSHIP", "마지막 소유자는 제거할 수 없습니다.", 409),
    CANNOT_DEMOTE_LAST_OWNER("CANNOT_DEMOTE_LAST_OWNER", "마지막 소유자의 권한을 변경할 수 없습니다.", 409);
}
