package com.fixy.house.invitation.domain

import com.fixy.house.invitation.domain.vo.InvitationStatus
import com.fixy.house.team.domain.vo.TeamRole
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import java.time.Instant

class InvitationTest : DescribeSpec({

    describe("Invitation init") {
        it("유효한 입력으로 생성된다") {
            val expiresAt = Instant.now().plusSeconds(3600)
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "hash",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u1",
                expiresAt = expiresAt
            )
            inv.status shouldBe InvitationStatus.PENDING
        }

        it("teamId 가 비어 있으면 실패") {
            shouldThrow<IllegalArgumentException> {
                Invitation(
                    teamId = "",
                    invitedEmail = "user@example.com",
                    role = TeamRole.MEMBER,
                    tokenHash = "h",
                    status = InvitationStatus.PENDING,
                    invitedByUserId = "u1",
                    expiresAt = Instant.now().plusSeconds(60)
                )
            }
        }

        it("tokenHash 가 비어 있으면 실패") {
            shouldThrow<IllegalArgumentException> {
                Invitation(
                    teamId = "t1",
                    invitedEmail = "user@example.com",
                    role = TeamRole.MEMBER,
                    tokenHash = "",
                    status = InvitationStatus.PENDING,
                    invitedByUserId = "u1",
                    expiresAt = Instant.now().plusSeconds(60)
                )
            }
        }
    }

    describe("Invitation.accept") {
        it("PENDING 상태이고 만료 전이면 수락된다") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val expiresAt = now.plusSeconds(3600)
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "h",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = expiresAt
            )
            inv.accept("u1", now)
            inv.status shouldBe InvitationStatus.ACCEPTED
            inv.acceptedAt shouldBe now
            inv.acceptedByUserId shouldBe "u1"
        }

        it("만료된 초대면 IllegalStateException") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "h",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = now.minusSeconds(10)
            )
            shouldThrow<IllegalStateException> { inv.accept("u1", now) }
        }

        it("PENDING 이 아니면 IllegalStateException") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "h",
                status = InvitationStatus.REVOKED,
                invitedByUserId = "u9",
                expiresAt = now.plusSeconds(3600)
            )
            shouldThrow<IllegalStateException> { inv.accept("u1", now) }
        }
    }

    describe("Invitation.revoke") {
        it("PENDING 상태에서만 취소된다") {
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "h",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = Instant.now().plusSeconds(60)
            )
            inv.revoke()
            inv.status shouldBe InvitationStatus.REVOKED
        }

        it("PENDING 이 아니면 IllegalStateException") {
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "h",
                status = InvitationStatus.ACCEPTED,
                invitedByUserId = "u9",
                expiresAt = Instant.now().plusSeconds(60)
            )
            shouldThrow<IllegalStateException> { inv.revoke() }
        }
    }

    describe("Invitation.markExpired") {
        it("PENDING 이고 만료 시점이 지나면 EXPIRED 로 바뀐다") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "h",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = now.minusSeconds(1)
            )
            inv.markExpired(now)
            inv.status shouldBe InvitationStatus.EXPIRED
        }

        it("PENDING 이지만 만료 전이면 변하지 않는다") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val inv = Invitation(
                teamId = "t1",
                invitedEmail = "user@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "h",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = now.plusSeconds(60)
            )
            inv.markExpired(now)
            inv.status shouldBe InvitationStatus.PENDING
        }
    }
})
