package com.fixy.house.user.infrastructure.repository

import com.fixy.house.user.domain.User
import com.fixy.house.user.domain.UserRepository
import com.fixy.house.user.infrastructure.entity.UserEntity
import org.springframework.stereotype.Repository

@Repository
class UserRepositoryImpl(
    private val userMongoRepository: UserMongoRepository
) : UserRepository {

    override fun findById(userId: String): User? =
        userMongoRepository.findById(userId).orElse(null)?.toDomain()

    override fun findByEmail(email: String): User? =
        userMongoRepository.findByEmail(email.lowercase())?.toDomain()

    override fun existsByEmail(email: String): Boolean =
        userMongoRepository.existsByEmail(email.lowercase())

    override fun save(user: User): User =
        userMongoRepository.save(UserEntity.from(user)).toDomain()

    override fun delete(user: User) {
        user.id?.let { userMongoRepository.deleteById(it) }
    }
}
