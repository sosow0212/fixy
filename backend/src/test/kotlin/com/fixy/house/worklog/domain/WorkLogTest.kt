package com.fixy.house.worklog.domain

import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import java.time.Instant

class WorkLogTest : DescribeSpec({

    describe("WorkLog.create") {
        it("유효한 필드로 WorkLog 를 생성한다") {
            val workLog = WorkLog.create(
                teamId = "team-1",
                userId = "user-1",
                title = "보고서 작성",
                description = "주간 보고",
                priority = WorkLogPriority.HIGH,
                tags = listOf("weekly"),
                dueDate = null,
                parentId = null,
                sessionId = null
            )
            workLog.status shouldBe WorkLogStatus.TODO
            workLog.completedAt shouldBe null
            workLog.priority shouldBe WorkLogPriority.HIGH
            workLog.id shouldBe null
        }

        it("빈 teamId 는 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                WorkLog.create(" ", "u", "t", null, WorkLogPriority.LOW, emptyList(), null, null, null)
            }
        }

        it("빈 userId 는 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                WorkLog.create("t", " ", "title", null, WorkLogPriority.LOW, emptyList(), null, null, null)
            }
        }

        it("빈 title 은 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                WorkLog.create("t", "u", " ", null, WorkLogPriority.LOW, emptyList(), null, null, null)
            }
        }

        it("title 이 200자 초과면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                WorkLog.create("t", "u", "a".repeat(201), null, WorkLogPriority.LOW, emptyList(), null, null, null)
            }
        }
    }

    describe("WorkLog.update - status transition") {
        it("DONE 으로 전환하면 completedAt 이 설정된다") {
            val workLog = WorkLog.create(
                teamId = "t",
                userId = "u",
                title = "t",
                description = null,
                priority = WorkLogPriority.MEDIUM,
                tags = emptyList(),
                dueDate = null,
                parentId = null,
                sessionId = null
            )
            workLog.update(null, null, WorkLogStatus.DONE, null, null, null)
            workLog.status shouldBe WorkLogStatus.DONE
            workLog.completedAt shouldNotBe null
            workLog.completedAt!! shouldNotBe Instant.EPOCH
        }

        it("DONE 에서 다른 상태로 돌아가면 completedAt 이 null 로 초기화된다") {
            val workLog = WorkLog.create(
                teamId = "t",
                userId = "u",
                title = "t",
                description = null,
                priority = WorkLogPriority.MEDIUM,
                tags = emptyList(),
                dueDate = null,
                parentId = null,
                sessionId = null
            )
            workLog.update(null, null, WorkLogStatus.DONE, null, null, null)
            workLog.completedAt shouldNotBe null
            workLog.update(null, null, WorkLogStatus.TODO, null, null, null)
            workLog.status shouldBe WorkLogStatus.TODO
            workLog.completedAt shouldBe null
        }

        it("같은 상태로의 update 는 completedAt 을 건드리지 않는다") {
            val workLog = WorkLog.create(
                teamId = "t",
                userId = "u",
                title = "t",
                description = null,
                priority = WorkLogPriority.MEDIUM,
                tags = emptyList(),
                dueDate = null,
                parentId = null,
                sessionId = null
            )
            workLog.update(null, null, WorkLogStatus.IN_PROGRESS, null, null, null)
            workLog.completedAt shouldBe null
        }
    }

    describe("WorkLog.update - fields") {
        it("title 만 변경") {
            val workLog = WorkLog.create("t", "u", "old", null, WorkLogPriority.LOW, emptyList(), null, null, null)
            workLog.update("new", null, null, null, null, null)
            workLog.title shouldBe "new"
        }

        it("빈 title 로의 update 는 IllegalArgumentException") {
            val workLog = WorkLog.create("t", "u", "title", null, WorkLogPriority.LOW, emptyList(), null, null, null)
            shouldThrow<IllegalArgumentException> {
                workLog.update(" ", null, null, null, null, null)
            }
        }
    }

    describe("WorkLogStatus.isTerminal") {
        it("DONE 만 true") {
            WorkLogStatus.DONE.isTerminal() shouldBe true
            WorkLogStatus.TODO.isTerminal() shouldBe false
            WorkLogStatus.IN_PROGRESS.isTerminal() shouldBe false
            WorkLogStatus.BLOCKED.isTerminal() shouldBe false
        }
    }
})
