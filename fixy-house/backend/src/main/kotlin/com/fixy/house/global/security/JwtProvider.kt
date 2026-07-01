package com.fixy.house.global.security

import com.fixy.house.user.domain.vo.UserRole
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.stereotype.Component
import javax.crypto.SecretKey
import java.util.Date

@Component
class JwtProvider(
    @Value("\${app.security.jwt.secret}")
    private val secretKey: String,
    @Value("\${app.security.jwt.access-token-ttl-minutes:30}")
    private val accessTokenTtlMinutes: Long,
    @Value("\${app.security.jwt.refresh-token-ttl-days:14}")
    private val refreshTokenTtlDays: Long
) {

    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey))
    }

    val accessTokenTtlSeconds: Long
        get() = accessTokenTtlMinutes * 60L

    val refreshTokenTtlSeconds: Long
        get() = refreshTokenTtlDays * 24L * 60L * 60L

    fun generateAccessToken(userId: String, role: UserRole): String =
        generateToken(userId, role, accessTokenTtlMinutes * 60_000L)

    fun generateRefreshToken(userId: String): String =
        generateToken(userId, null, refreshTokenTtlDays * 24L * 60L * 60L * 1000L)

    private fun generateToken(userId: String, role: UserRole?, ttlMillis: Long): String {
        val now = Date()
        val expiry = Date(now.time + ttlMillis)
        val builder = Jwts.builder()
            .subject(userId)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(key)
        if (role != null) {
            builder.claim(AUTHORITIES_KEY, role.name)
        }
        return builder.compact()
    }

    fun resolveToken(request: HttpServletRequest): String? {
        val header = request.getHeader(HttpHeaders.AUTHORIZATION)
        if (header != null && header.startsWith("$BEARER_TYPE ")) {
            val token = header.substring(BEARER_TYPE.length + 1)
            if (token.isNotBlank()) return token
        }
        return request.getParameter("token")?.takeIf { it.isNotBlank() }
    }

    fun validateToken(token: String): Boolean = try {
        parseClaims(token)
        true
    } catch (_: JwtException) {
        false
    } catch (_: IllegalArgumentException) {
        false
    }

    fun getSubjectAsUserId(token: String): String = parseClaims(token).subject

    fun findAuthentication(token: String): Authentication {
        val claims = parseClaims(token)
        val userId = claims.subject
        return UsernamePasswordAuthenticationToken(userId, "", resolveAuthorities(claims))
    }

    private fun parseClaims(token: String): Claims = try {
        Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
    } catch (e: ExpiredJwtException) {
        throw e
    }

    private fun resolveAuthorities(claims: Claims): List<SimpleGrantedAuthority> {
        val raw = claims[AUTHORITIES_KEY]?.toString().orEmpty()
        val roles = raw.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        if (roles.isEmpty()) return listOf(SimpleGrantedAuthority("ROLE_USER"))
        return roles.map { role ->
            val normalized = if (role.startsWith("ROLE_")) role else "ROLE_$role"
            SimpleGrantedAuthority(normalized)
        }
    }

    companion object {
        private const val AUTHORITIES_KEY = "auth"
        private const val BEARER_TYPE = "Bearer"
    }
}
