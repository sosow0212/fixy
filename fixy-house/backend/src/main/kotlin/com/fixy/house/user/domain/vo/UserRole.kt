package com.fixy.house.user.domain.vo

enum class UserRole {
    USER,
    ADMIN;

    companion object {
        fun fromStringOrUser(value: String?): UserRole =
            value?.let { name -> entries.firstOrNull { it.name.equals(name, ignoreCase = true) } } ?: USER
    }
}
