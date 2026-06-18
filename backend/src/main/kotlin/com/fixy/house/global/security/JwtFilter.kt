package com.fixy.house.global.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

/**
 * Authorization: Bearer <token> (또는 ?token=) 에서 JWT 를 읽어 인증을 설정한다.
 */
class JwtFilter(
    private val jwtProvider: JwtProvider
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val token = jwtProvider.resolveToken(request)
        if (!token.isNullOrBlank() && jwtProvider.validateToken(token)) {
            val authentication = jwtProvider.findAuthentication(token)
            SecurityContextHolder.getContext().authentication = authentication
        }
        filterChain.doFilter(request, response)
    }
}
