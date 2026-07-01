package com.fixy.house.team.domain.vo

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe

class TeamRoleTest : DescribeSpec({

    describe("TeamRole.isAtLeast") {
        it("OWNER 는 모든 권한 이상") {
            TeamRole.OWNER.isAtLeast(TeamRole.OWNER) shouldBe true
            TeamRole.OWNER.isAtLeast(TeamRole.MANAGER) shouldBe true
            TeamRole.OWNER.isAtLeast(TeamRole.MEMBER) shouldBe true
        }

        it("MANAGER 는 MANAGER 와 MEMBER 이상") {
            TeamRole.MANAGER.isAtLeast(TeamRole.OWNER) shouldBe false
            TeamRole.MANAGER.isAtLeast(TeamRole.MANAGER) shouldBe true
            TeamRole.MANAGER.isAtLeast(TeamRole.MEMBER) shouldBe true
        }

        it("MEMBER 는 MEMBER 만") {
            TeamRole.MEMBER.isAtLeast(TeamRole.OWNER) shouldBe false
            TeamRole.MEMBER.isAtLeast(TeamRole.MANAGER) shouldBe false
            TeamRole.MEMBER.isAtLeast(TeamRole.MEMBER) shouldBe true
        }
    }

    describe("TeamRole.fromStringOrMember") {
        it("정상적인 이름은 해당 enum 으로") {
            TeamRole.fromStringOrMember("OWNER") shouldBe TeamRole.OWNER
            TeamRole.fromStringOrMember("manager") shouldBe TeamRole.MANAGER
            TeamRole.fromStringOrMember("MEMBER") shouldBe TeamRole.MEMBER
        }

        it("null 이나 모르는 값은 MEMBER") {
            TeamRole.fromStringOrMember(null) shouldBe TeamRole.MEMBER
            TeamRole.fromStringOrMember("INVALID") shouldBe TeamRole.MEMBER
        }
    }
})
