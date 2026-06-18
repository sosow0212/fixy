package com.fixy.house.user.ui

import com.fixy.house.user.application.dto.response.TokenResponse
import com.fixy.house.user.application.dto.request.LoginRequest
import com.fixy.house.user.application.dto.request.RefreshTokenRequest
import com.fixy.house.user.application.dto.request.SignupRequest
import com.fixy.house.user.application.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Auth", description = "회원가입/로그인/리프레시")
@RestController
@RequestMapping("/api/v1/auth")
class AuthApi(private val authService: AuthService) {

    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    fun signup(@Valid @RequestBody request: SignupRequest): ResponseEntity<TokenResponse> =
        ResponseEntity
            .status(HttpStatus.CREATED)
            .body(authService.signUp(request.email, request.password, request.displayName))

    @Operation(summary = "로그인")
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<TokenResponse> =
        ResponseEntity.ok(authService.login(request.email, request.password))

    @Operation(summary = "리프레시 토큰 재발급")
    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ResponseEntity<TokenResponse> =
        ResponseEntity.ok(authService.refresh(request.refreshToken))
}
