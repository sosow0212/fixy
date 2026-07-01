package com.fixy.house.worklog.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.worklog.application.dto.request.CreateWorkLogRequest
import com.fixy.house.worklog.application.dto.request.UpdateWorkLogRequest
import com.fixy.house.worklog.application.dto.response.WorkLogSummaryResponse
import com.fixy.house.worklog.domain.WorkLog
import com.fixy.house.worklog.domain.WorkLogRepository
import com.fixy.house.worklog.domain.exception.WorkLogExceptionType
import com.fixy.house.worklog.domain.policy.TeamRoleResolver
import com.fixy.house.worklog.domain.vo.TeamRole
import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class WorkLogService(
    private val workLogRepository: WorkLogRepository,
    private val teamRoleResolver: TeamRoleResolver
) {

    @Transactional
    fun create(actorUserId: String, teamId: String, request: CreateWorkLogRequest): WorkLogSummaryResponse {
        requireMember(actorUserId, teamId)

        request.parentId?.let { parentId ->
            val parent = workLogRepository.findById(parentId)
                ?: throw CustomException(WorkLogExceptionType.PARENT_WORK_LOG_NOT_FOUND)
            if (parent.teamId != teamId) {
                throw CustomException(WorkLogExceptionType.PARENT_WORK_LOG_MISMATCH)
            }
        }

        val workLog = WorkLog.create(
            teamId = teamId,
            userId = request.assigneeUserId ?: actorUserId,
            title = request.title,
            description = request.description,
            priority = request.priority ?: WorkLogPriority.MEDIUM,
            tags = request.tags,
            dueDate = request.dueDate,
            parentId = request.parentId,
            sessionId = request.sessionId
        )
        if (request.status != null && request.status != WorkLogStatus.TODO) {
            workLog.update(
                newTitle = null,
                newDescription = null,
                newStatus = request.status,
                newPriority = null,
                newTags = null,
                newDueDate = null
            )
        }
        return WorkLogSummaryResponse.from(workLogRepository.save(workLog))
    }

    @Transactional(readOnly = true)
    fun list(
        actorUserId: String,
        teamId: String,
        statuses: List<WorkLogStatus>?,
        priorities: List<WorkLogPriority>?,
        assigneeUserId: String?,
        search: String?,
        dueBefore: LocalDate?,
        page: Int,
        size: Int
    ): Page<WorkLogSummaryResponse> {
        requireMember(actorUserId, teamId)
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "created_at"))
        return workLogRepository.findPageByTeamId(
            teamId = teamId,
            statuses = statuses,
            priorities = priorities,
            assigneeUserId = assigneeUserId,
            search = search,
            dueBefore = dueBefore,
            pageable = pageable
        ).map { WorkLogSummaryResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun get(actorUserId: String, workLogId: String): WorkLogSummaryResponse {
        val workLog = findById(workLogId)
        requireMember(actorUserId, workLog.teamId)
        return WorkLogSummaryResponse.from(workLog)
    }

    @Transactional
    fun update(actorUserId: String, workLogId: String, request: UpdateWorkLogRequest): WorkLogSummaryResponse {
        val workLog = findById(workLogId)
        requireAuthorOrManager(actorUserId, workLog)
        workLog.update(
            newTitle = request.title,
            newDescription = request.description,
            newStatus = request.status,
            newPriority = request.priority,
            newTags = request.tags,
            newDueDate = request.dueDate
        )
        return WorkLogSummaryResponse.from(workLogRepository.save(workLog))
    }

    @Transactional
    fun delete(actorUserId: String, workLogId: String) {
        val workLog = findById(workLogId)
        requireAuthorOrManager(actorUserId, workLog)
        workLogRepository.delete(workLog)
    }

    @Transactional(readOnly = true)
    fun findById(workLogId: String): WorkLog =
        workLogRepository.findById(workLogId)
            ?: throw CustomException(WorkLogExceptionType.WORK_LOG_NOT_FOUND)

    private fun requireMember(actorUserId: String, teamId: String) {
        val role = teamRoleResolver.resolveRole(actorUserId, teamId)
            ?: throw CustomException(WorkLogExceptionType.WORK_LOG_FORBIDDEN)
        if (role == TeamRole.OWNER || role == TeamRole.MANAGER || role == TeamRole.MEMBER) return
        throw CustomException(WorkLogExceptionType.WORK_LOG_FORBIDDEN)
    }

    private fun requireAuthorOrManager(actorUserId: String, workLog: WorkLog) {
        if (workLog.userId == actorUserId) return
        val role = teamRoleResolver.resolveRole(actorUserId, workLog.teamId)
            ?: throw CustomException(WorkLogExceptionType.WORK_LOG_FORBIDDEN)
        if (role.isAtLeastManager()) return
        throw CustomException(WorkLogExceptionType.WORK_LOG_FORBIDDEN)
    }
}
