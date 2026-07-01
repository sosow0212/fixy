package com.fixy.house.user.infrastructure.repository

import com.fixy.house.user.domain.vo.UserRole
import com.fixy.house.user.infrastructure.entity.UserEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface UserMongoRepository : MongoRepository<UserEntity, String> {
    fun findByEmail(email: String): UserEntity?
    fun existsByEmail(email: String): Boolean
    fun findAllByRole(role: UserRole): List<UserEntity>
}
