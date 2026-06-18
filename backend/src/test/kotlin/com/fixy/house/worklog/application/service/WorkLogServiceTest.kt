package com.fixy.house.worklog.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.worklog.application.dto.request.CreateWorkLogRequest
import com.fixy.house.worklog.application.dto.request.UpdateWorkLogRequest
import com.fixy.house.worklog.domain.WorkLog
import com.fixy.house.worklog.domain.WorkLogRepository
import com.fixy.house.worklog.domain.exception.WorkLogExceptionType
import com.fixy.house.worklog.domain.policy.TeamRoleResolver
import com.fixy.house.worklog.domain.vo.TeamRole
import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import java.time.Instant
import java.time.LocalDate

class WorkLogServiceTest : DescribeSpec({

    val workLogRepository: WorkLogRepository = mockk(relaxed = true)
    val teamRoleResolver: TeamRoleResolver = mockk()
    val service = WorkLogService(workLogRepository, teamRoleResolver)

    fun stubWorkLog(
        id: String = "wl-1",
        teamId: String = "team-1",
        userId: String = "user-1"
    ): WorkLog {
        val workLog = WorkLog.create(
            teamId = teamId,
            userId = userId,
            title = "task",
            description = null,
            priority = WorkLogPriority.MEDIUM,
            tags = emptyList(),
            dueDate = null,
            parentId = null,
            sessionId = null
        )
        workLog.id = id
        workLog.createdAt = Instant.parse("2026-01-01T00:00:00Z")
        return workLog
    }

    beforeEach {
        clearMocks(workLogRepository, teamRoleResolver)
    }

    describe("create") {
        it("MEMBER 가 생성하면 저장된다") {
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns TeamRole.MEMBER
            every { workLogRepository.save(any()) } answers { firstArg() }

            val response = service.create(
                actorUserId = "actor",
                teamId = "team-1",
                request = CreateWorkLogRequest(
                    title = "새 작업",
                    description = "desc",
                    priority = WorkLogPriority.HIGH,
                    tags = listOf("a"),
                    dueDate = LocalDate.parse("2026-02-01")
                )
            )
            response.title shouldBe "새 작업"
            response.priority shouldBe WorkLogPriority.HIGH
            verify(exactly = 1) { workLogRepository.save(any()) }
        }

        it("팀원이 아니면 WORK_LOG_FORBIDDEN") {
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns null
            shouldThrow<CustomException> {
                service.create("actor", "team-1", CreateWorkLogRequest(title = "x"))
            }
        }

        it("parentId 가 존재하지 않으면 PARENT_WORK_LOG_NOT_FOUND") {
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns TeamRole.MEMBER
            every { workLogRepository.findById("missing-parent") } returns null
            val request = CreateWorkLogRequest(title = "x", parentId = "missing-parent")
            val ex = shouldThrow<CustomException> { service.create("actor", "team-1", request) }
            ex.getExceptionType() shouldBe WorkLogExceptionType.PARENT_WORK_LOG_NOT_FOUND
        }

        it("parentId 가 다른 팀이면 PARENT_WORK_LOG_MISMATCH") {
            val otherTeamParent = stubWorkLog(id = "p", teamId = "team-other", userId = "x")
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns TeamRole.MEMBER
            every { workLogRepository.findById("p") } returns otherTeamParent
            val request = CreateWorkLogRequest(title = "x", parentId = "p")
            val ex = shouldThrow<CustomException> { service.create("actor", "team-1", request) }
            ex.getExceptionType() shouldBe WorkLogExceptionType.PARENT_WORK_LOG_MISMATCH
        }
    }

    describe("update") {
        it("작성자는 status 를 DONE 으로 변경할 수 있다") {
            val workLog = stubWorkLog()
            every { workLogRepository.findById("wl-1") } returns workLog
            every { workLogRepository.save(any()) } answers { firstArg() }

            val response = service.update(
                actorUserId = "user-1",
                workLogId = "wl-1",
                request = UpdateWorkLogRequest(status = WorkLogStatus.DONE)
            )
            response.status shouldBe WorkLogStatus.DONE
            response.completedAt shouldNotBe null
        }

        it("작성자가 아니고 MANAGER 도 아니면 WORK_LOG_FORBIDDEN") {
            val workLog = stubWorkLog(userId = "author")
            every { workLogRepository.findById("wl-1") } returns workLog
            every { teamRoleResolver.resolveRole("outsider", "team-1") } returns TeamRole.MEMBER
            val ex = shouldThrow<CustomException> {
                service.update("outsider", "wl-1", UpdateWorkLogRequest(title = "x"))
            }
            ex.getExceptionType() shouldBe WorkLogExceptionType.WORK_LOG_FORBIDDEN
        }

        it("MANAGER 는 작성자가 아니어도 수정 가능") {
            val workLog = stubWorkLog(userId = "author")
            every { workLogRepository.findById("wl-1") } returns workLog
            every { teamRoleResolver.resolveRole("manager", "team-1") } returns TeamRole.MANAGER
            every { workLogRepository.save(any()) } answers { firstArg() }

            val response = service.update(
                actorUserId = "manager",
                workLogId = "wl-1",
                request = UpdateWorkLogRequest(title = "new")
            )
            response.title shouldBe "new"
        }
    }

    describe("delete") {
        it("작성자는 삭제 가능") {
            val workLog = stubWorkLog(userId = "user-1")
            every { workLogRepository.findById("wl-1") } returns workLog
            every { workLogRepository.delete(workLog) } returns Unit

            service.delete("user-1", "wl-1")
            verify { workLogRepository.delete(workLog) }
        }

        it("작성자가 아닌 MEMBER 가 삭제하면 FORBIDDEN") {
            val workLog = stubWorkLog(userId = "author")
            every { workLogRepository.findById("wl-1") } returns workLog
            every { teamRoleResolver.resolveRole("outsider", "team-1") } returns TeamRole.MEMBER
            val ex = shouldThrow<CustomException> { service.delete("outsider", "wl-1") }
            ex.getExceptionType() shouldBe WorkLogExceptionType.WORK_LOG_FORBIDDEN
        }
    }

    describe("get") {
        it("존재하지 않으면 WORK_LOG_NOT_FOUND") {
            every { workLogRepository.findById("nope") } returns null
            val ex = shouldThrow<CustomException> { service.get("actor", "nope") }
            ex.getExceptionType() shouldBe WorkLogExceptionType.WORK_LOG_NOT_FOUND
        }
    }
})
