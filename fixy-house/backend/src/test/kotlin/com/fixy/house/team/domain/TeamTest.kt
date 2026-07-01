package com.fixy.house.team.domain

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe

class TeamTest : DescribeSpec({

    describe("Team init") {
        it("유효한 이름과 슬러그로 생성된다") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1")
            team.name shouldBe "Fixy"
            team.slug shouldBe "fixy"
            team.ownerUserId shouldBe "u1"
            team.description shouldBe null
            team.id shouldBe null
        }

        it("빈 이름이면 실패") {
            shouldThrow<IllegalArgumentException> {
                Team(name = "", slug = "fixy", ownerUserId = "u1")
            }
        }

        it("50자 초과 이름이면 실패") {
            shouldThrow<IllegalArgumentException> {
                Team(name = "a".repeat(51), slug = "fixy", ownerUserId = "u1")
            }
        }

        it("소문자/숫자/하이픈이 아닌 슬러그면 실패") {
            shouldThrow<IllegalArgumentException> {
                Team(name = "Fixy", slug = "Fixy!", ownerUserId = "u1")
            }
        }

        it("2자 미만 슬러그면 실패") {
            shouldThrow<IllegalArgumentException> {
                Team(name = "Fixy", slug = "a", ownerUserId = "u1")
            }
        }

        it("40자 초과 슬러그면 실패") {
            shouldThrow<IllegalArgumentException> {
                Team(name = "Fixy", slug = "a".repeat(41), ownerUserId = "u1")
            }
        }

        it("빈 ownerUserId 이면 실패") {
            shouldThrow<IllegalArgumentException> {
                Team(name = "Fixy", slug = "fixy", ownerUserId = "")
            }
        }
    }

    describe("Team.rename") {
        it("정상적으로 이름이 변경된다") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1")
            team.rename("Fixy Studio")
            team.name shouldBe "Fixy Studio"
        }

        it("빈 이름으로 변경 시도하면 실패") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1")
            shouldThrow<IllegalArgumentException> { team.rename("") }
        }

        it("50자 초과 이름으로 변경 시도하면 실패") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1")
            shouldThrow<IllegalArgumentException> { team.rename("a".repeat(51)) }
        }
    }

    describe("Team.updateDescription") {
        it("설명이 변경된다") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1", description = "old")
            team.updateDescription("new")
            team.description shouldBe "new"
        }

        it("null 로 설정하면 null 이 된다") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1", description = "old")
            team.updateDescription(null)
            team.description shouldBe null
        }

        it("빈 문자열은 null 로 정규화된다") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1", description = "old")
            team.updateDescription("   ")
            team.description shouldBe null
        }
    }

    describe("Team.transferOwnership") {
        it("정상적으로 소유자가 변경된다") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1")
            team.transferOwnership("u2")
            team.ownerUserId shouldBe "u2"
        }

        it("빈 사용자 ID 로 변경 시도하면 실패") {
            val team = Team(name = "Fixy", slug = "fixy", ownerUserId = "u1")
            shouldThrow<IllegalArgumentException> { team.transferOwnership("") }
        }
    }
})
