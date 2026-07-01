package com.fixy.house.user.domain.vo

import com.fixy.house.global.exceptions.CustomException
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe

class EmailTest : DescribeSpec({

    describe("Email.of") {
        it("정상 이메일을 받아 lower-case 정규화한다") {
            Email.of("User@Example.COM").value shouldBe "user@example.com"
        }

        it("앞뒤 공백을 제거한다") {
            Email.of("  user@example.com  ").value shouldBe "user@example.com"
        }

        it("형식이 잘못되면 CustomException (BAD_REQUEST)") {
            val ex = shouldThrow<CustomException> { Email.of("not-an-email") }
            ex.getExceptionType().errorCode shouldBe "BAD_REQUEST"
        }

        it("5자 미만이면 CustomException") {
            shouldThrow<CustomException> { Email.of("a@b.") }
        }
    }
})

class DisplayNameTest : DescribeSpec({
    describe("DisplayName.of") {
        it("2~30자 범위만 허용") {
            DisplayName.of("ab").value shouldBe "ab"
            DisplayName.of("a".repeat(30)).value shouldBe "a".repeat(30)
            shouldThrow<CustomException> { DisplayName.of("a") }
            shouldThrow<CustomException> { DisplayName.of("a".repeat(31)) }
        }

        it("앞뒤 공백 제거") {
            DisplayName.of("  fixy  ").value shouldBe "fixy"
        }
    }
})

class RawPasswordTest : DescribeSpec({
    describe("RawPassword.of") {
        it("영문 + 숫자 + 8자 이상이면 통과") {
            RawPassword.of("fixy1234").value shouldBe "fixy1234"
        }

        it("영문 없으면 실패") {
            shouldThrow<CustomException> { RawPassword.of("12345678") }
        }

        it("숫자 없으면 실패") {
            shouldThrow<CustomException> { RawPassword.of("abcdefgh") }
        }

        it("8자 미만이면 실패") {
            shouldThrow<CustomException> { RawPassword.of("a1b2c3") }
        }

        it("64자 초과면 실패") {
            shouldThrow<CustomException> { RawPassword.of("a1${"b".repeat(64)}") }
        }
    }
})
