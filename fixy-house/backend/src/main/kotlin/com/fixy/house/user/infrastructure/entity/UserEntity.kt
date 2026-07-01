package com.fixy.house.user.infrastructure.entity

import com.fixy.house.global.MongoAuditableEntity
import com.fixy.house.user.domain.User
import com.fixy.house.user.domain.vo.UserRole
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant

@Document(collection = "users")
class UserEntity(
    @Id
    var id: String? = null,

    @Indexed(unique = true)
    @Field(name = "email")
    var email: String,

    @Field(name = "password_hash")
    var passwordHash: String,

    @Field(name = "display_name")
    var displayName: String,

    @Field(name = "role")
    var role: UserRole = UserRole.USER,

    @Field(name = "last_login_at")
    var lastLoginAt: Instant? = null,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): User = User(
        id = id,
        email = email,
        passwordHash = passwordHash,
        displayName = displayName,
        role = role,
        lastLoginAt = lastLoginAt
    ).also { it.createdAt = createdAt; it.updatedAt = updatedAt }

    companion object {
        fun from(domain: User): UserEntity = UserEntity(
            id = domain.id,
            email = domain.email,
            passwordHash = domain.passwordHash,
            displayName = domain.displayName,
            role = domain.role,
            lastLoginAt = domain.lastLoginAt
        ).also {
            it.createdAt = domain.createdAt
            it.updatedAt = domain.updatedAt
        }
    }
}
