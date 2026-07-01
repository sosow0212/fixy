package com.fixy.house.global.security

import com.fixy.house.agent.application.service.AgentService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

class AgentKeyAuthenticationFilter(
    private val agentService: AgentService
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val key = request.getHeader(AGENT_KEY_HEADER)?.takeIf { it.isNotBlank() }
        if (key != null) {
            try {
                val agent = agentService.authenticateByKey(key)
                val authentication = UsernamePasswordAuthenticationToken(
                    agent.id!!, "", listOf(SimpleGrantedAuthority("ROLE_AGENT"))
                )
                SecurityContextHolder.getContext().authentication = authentication
            } catch (e: Exception) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.message)
                return
            }
        }
        filterChain.doFilter(request, response)
    }

    companion object {
        const val AGENT_KEY_HEADER = "X-Fixy-Agent-Key"
    }
}
