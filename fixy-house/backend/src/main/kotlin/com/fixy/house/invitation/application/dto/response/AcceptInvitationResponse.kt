package com.fixy.house.invitation.application.dto.response

import io.swagger.v3.oas.annotations.media.Schema

data class AcceptInvitationResponse(
    @Schema(description = "신규 사용자 여부") val newUser: Boolean,
    @Schema(description = "액세스 토큰 (JWT)") val accessToken: String,
    @Schema(description = "리프레시 토큰 (JWT)") val refreshToken: String,
    @Schema(description = "사용자 ID") val userId: String,
    @Schema(description = "팀 ID") val teamId: String
)
