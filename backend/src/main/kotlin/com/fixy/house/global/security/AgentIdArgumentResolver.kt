package com.fixy.house.global.security

import org.springframework.core.MethodParameter
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer

/**
 * @AgentId 가 붙은 파라미터에 SecurityContext 의 principal(String agentId) 을 주입.
 *
 * @see AgentKeyAuthenticationFilter
 */
@Component
class AgentIdArgumentResolver : HandlerMethodArgumentResolver {

    override fun supportsParameter(parameter: MethodParameter): Boolean =
        parameter.hasParameterAnnotation(AgentId::class.java) &&
            parameter.parameterType == String::class.java

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?
    ): String? {
        val authentication = SecurityContextHolder.getContext().authentication ?: return null
        if (!authentication.isAuthenticated) return null
        return authentication.principal?.toString()
    }
}
