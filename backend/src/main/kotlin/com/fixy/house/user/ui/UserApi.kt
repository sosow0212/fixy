package com.fixy.house.user.ui

import com.fixy.house.global.security.AuthUser
import com.fixy.house.user.application.dto.response.UserSummaryResponse
import com.fixy.house.user.application.dto.request.ChangePasswordRequest
import com.fixy.house.user.application.dto.request.UpdateProfileRequest
import com.fixy.house.user.application.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Users", description = "내 정보 조회/수정")
@RestController
@RequestMapping("/api/v1/users")
class UserApi(private val userService: UserService) {

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    fun getMyInfo(@AuthUser userId: String): ResponseEntity<UserSummaryResponse> =
        ResponseEntity.ok(userService.getMyInfo(userId))

    @Operation(summary = "표시 이름 수정")
    @PatchMapping("/me")
    fun updateMyProfile(
        @AuthUser userId: String,
        @Valid @RequestBody request: UpdateProfileRequest
    ): ResponseEntity<UserSummaryResponse> =
        ResponseEntity.ok(userService.updateDisplayName(userId, request.displayName))

    @Operation(summary = "비밀번호 변경")
    @PatchMapping("/me/password")
    fun changePassword(
        @AuthUser userId: String,
        @Valid @RequestBody request: ChangePasswordRequest
    ): ResponseEntity<Void> {
        userService.changePassword(userId, request.currentPassword, request.newPassword)
        return ResponseEntity.noContent().build()
    }
}
