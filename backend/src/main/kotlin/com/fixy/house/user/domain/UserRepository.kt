package com.fixy.house.user.domain

interface UserRepository {
    fun findById(userId: String): User?
    fun findByEmail(email: String): User?
    fun existsByEmail(email: String): Boolean
    fun save(user: User): User
    fun delete(user: User)
}
