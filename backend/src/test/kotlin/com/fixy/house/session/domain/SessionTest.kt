package com.fixy.house.session.domain

import com.fixy.house.session.domain.vo.SessionStatus
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import java.time.Instant

class SessionTest : DescribeSpec({

    describe("Session.start") {
        it("정상 입력으로 세션 생성") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val s = Session.start(
                agentId = "a1", teamId = "t1", sessionIdFromAgent = "ses_xyz",
                userIdOnAgent = null, projectName = "fixy-house", startedAt = now
            )
            s.status shouldBe SessionStatus.ACTIVE
            s.messageCount shouldBe 0
            s.toolCallCount shouldBe 0
            s.episodeCount shouldBe 0
            s.lastActivityAt shouldBe now
        }

        it("agentId 비어 있으면 실패") {
            shouldThrow<IllegalArgumentException> {
                Session.start("", "t1", "ses_x", null, null, Instant.now())
            }
        }

        it("teamId 비어 있으면 실패") {
            shouldThrow<IllegalArgumentException> {
                Session.start("a1", "", "ses_x", null, null, Instant.now())
            }
        }
    }

    describe("Session.recordMessageAppended") {
        it("메시지 카운트와 lastActivityAt 증가") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val later = now.plusSeconds(10)
            val s = Session.start("a1", "t1", "ses_x", null, null, now)
            s.recordMessageAppended(later)
            s.messageCount shouldBe 1
            s.lastActivityAt shouldBe later
        }

        it("종료된 세션에는 append 불가") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val s = Session.start("a1", "t1", "ses_x", null, null, now)
            s.end(SessionStatus.COMPLETED, now)
            shouldThrow<IllegalStateException> { s.recordMessageAppended(now) }
        }
    }

    describe("Session.end") {
        it("COMPLETED/FAILED 만 허용") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val s = Session.start("a1", "t1", "ses_x", null, null, now)
            shouldThrow<IllegalArgumentException> { s.end(SessionStatus.ACTIVE, now) }
        }

        it("요약과 함께 종료") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val s = Session.start("a1", "t1", "ses_x", null, null, now)
            s.end(SessionStatus.COMPLETED, now.plusSeconds(60), summary = "done")
            s.status shouldBe SessionStatus.COMPLETED
            s.endedAt shouldBe now.plusSeconds(60)
            s.summary shouldBe "done"
        }
    }

    describe("Session.markIdle") {
        it("ACTIVE → IDLE 전환") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val s = Session.start("a1", "t1", "ses_x", null, null, now)
            s.markIdle(now.plusSeconds(5))
            s.status shouldBe SessionStatus.IDLE
        }

        it("이미 종료된 세션은 markIdle 무시") {
            val now = Instant.parse("2026-01-01T00:00:00Z")
            val s = Session.start("a1", "t1", "ses_x", null, null, now)
            s.end(SessionStatus.COMPLETED, now)
            s.markIdle(now.plusSeconds(5))
            s.status shouldBe SessionStatus.COMPLETED
        }
    }

    describe("Session.ownedBy") {
        it("agentId 가 일치하면 true") {
            val s = Session.start("a1", "t1", "ses_x", null, null, Instant.now())
            s.ownedBy("a1") shouldBe true
            s.ownedBy("a2") shouldBe false
        }
    }
})
