package com.fixy.house.global.config

import com.fixy.house.agent.application.service.AgentService
import com.fixy.house.global.security.AgentKeyAuthenticationFilter
import com.fixy.house.global.security.JwtFilter
import com.fixy.house.global.security.JwtProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtProvider: JwtProvider,
    private val agentService: AgentService,
    @Value("\${app.security.cors.allowed-origins}")
    private val allowedOrigins: List<String>
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { it.configurationSource(corsConfigurationSource()) }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(HttpMethod.GET, "/api/v1/health/**").permitAll()
                    .requestMatchers(*SWAGGER_WHITE_LIST).permitAll()
                    .requestMatchers(*AGENT_WHITE_LIST).permitAll() // 에이전트는 자체 키 필터가 인증
                    .requestMatchers(*AUTH_PUBLIC_LIST).permitAll()
                    .anyRequest().authenticated()
            }
            .exceptionHandling { exception ->
                exception.authenticationEntryPoint { _, response, _ ->
                    response.sendError(401)
                }
                exception.accessDeniedHandler { _, response, _ ->
                    response.sendError(403)
                }
            }
            .addFilterBefore(
                AgentKeyAuthenticationFilter(agentService),
                UsernamePasswordAuthenticationFilter::class.java
            )
            .addFilterBefore(
                JwtFilter(jwtProvider),
                UsernamePasswordAuthenticationFilter::class.java
            )
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        configuration.allowedOriginPatterns = allowedOrigins.ifEmpty { listOf("*") }
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true
        configuration.maxAge = 3600
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }

    companion object {
        private val SWAGGER_WHITE_LIST = arrayOf(
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/v3/api-docs.yaml",
            "/swagger-ui.html"
        )

        /** fixy-agent → backend 직접 호출 (자체 키 인증). */
        private val AGENT_WHITE_LIST = arrayOf(
            "/api/v1/agent/**"
        )

        /** 회원가입/로그인/리프레시. */
        private val AUTH_PUBLIC_LIST = arrayOf(
            "/api/v1/auth/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/invitations/accept"
        )
    }
}
