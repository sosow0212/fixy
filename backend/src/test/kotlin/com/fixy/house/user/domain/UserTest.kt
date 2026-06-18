package com.fixy.house.user.domain

import com.fixy.house.user.domain.vo.DisplayName
import com.fixy.house.user.domain.vo.Email
import com.fixy.house.user.domain.vo.UserRole
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.string.shouldStartWith
import java.time.Instant

class UserTest : DescribeSpec({

    describe("User.create") {
        it("유효한 입력이면 사용자를 생성한다") {
            val user = User.create(
                email = Email.of("User@Example.com"),
                passwordHash = "hashed",
                displayName = DisplayName.of("fixy")
            )
            user.email shouldBe "user@example.com"
            user.displayName shouldBe "fixy"
            user.role shouldBe UserRole.USER
            user.id shouldBe null
        }

        it("잘못된 이메일이면 CustomException 이 발생한다") {
            shouldThrow<Exception> {
                User.create(
                    email = Email.of("not-an-email"),
                    passwordHash = "hashed",
                    displayName = DisplayName.of("fixy")
                )
            }
        }

        it("짧은 표시 이름이면 CustomException 이 발생한다") {
            shouldThrow<Exception> {
                User.create(
                    email = Email.of("user@example.com"),
                    passwordHash = "hashed",
                    displayName = DisplayName.of("a")
                )
            }
        }
    }

    describe("User.updateDisplayName") {
        it("정상적으로 표시 이름을 변경한다") {
            val user = User.create(
                email = Email.of("a@b.com"),
                passwordHash = "h",
                displayName = DisplayName.of("orig")
            )
            user.updateDisplayName("  new name  ")
            user.displayName shouldBe "new name"
        }
    }

    describe("User.changePassword") {
        it("해시가 비어 있으면 IllegalArgumentException") {
            val user = User.create(
                email = Email.of("a@b.com"),
                passwordHash = "h",
                displayName = DisplayName.of("name")
            )
            shouldThrow<IllegalArgumentException> { user.changePassword("") }
        }

        it("해시가 비어 있지 않으면 교체된다") {
            val user = User.create(
                email = Email.of("a@b.com"),
                passwordHash = "h1",
                displayName = DisplayName.of("name")
            )
            user.changePassword("h2")
            user.passwordHash shouldBe "h2"
        }
    }

    describe("User.updateLastLoginTime") {
        it("lastLoginAt 이 갱신된다") {
            val user = User.create(
                email = Email.of("a@b.com"),
                passwordHash = "h",
                displayName = DisplayName.of("name")
            )
            val now = Instant.parse("2026-01-01T00:00:00Z")
            user.updateLastLoginTime(now)
            user.lastLoginAt shouldBe now
        }
    }

    describe("User.isPasswordMatch") {
        it("PasswordVerifier 가 true 면 true") {
            val user = User.create(
                email = Email.of("a@b.com"),
                passwordHash = "h",
                displayName = DisplayName.of("name")
            )
            val alwaysTrue = object : PasswordVerifier {
                override fun matches(plain: String, hashed: String): Boolean = true
            }
            user.isPasswordMatch("plain", alwaysTrue) shouldBe true
        }
    }
})
