package com.fixy.house.invitation.domain.exception

import com.fixy.house.global.exceptions.CustomExceptionType

enum class InvitationExceptionType(
    override val errorCode: String,
    override val message: String,
    override val httpStatusCode: Int
) : CustomExceptionType {
    INVITATION_NOT_FOUND("INVITATION_NOT_FOUND", "초대를 찾을 수 없습니다.", 404),
    INVITATION_EXPIRED("INVITATION_EXPIRED", "만료된 초대입니다.", 410),
    INVITATION_ALREADY_USED("INVITATION_ALREADY_USED", "이미 사용된 초대입니다.", 409),
    INVITATION_REVOKED("INVITATION_REVOKED", "취소된 초대입니다.", 410),
    INVITATION_EMAIL_MISMATCH("INVITATION_EMAIL_MISMATCH", "초대 이메일과 일치하지 않습니다.", 403);
}
