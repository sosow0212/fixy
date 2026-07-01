package com.fixy.house.worklog.domain

import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate

interface WorkLogRepository {
    fun findById(workLogId: String): WorkLog?
    fun findByTeamIdAndId(teamId: String, workLogId: String): WorkLog?
    fun findAllByTeamId(teamId: String): List<WorkLog>
    fun findAllByTeamIdAndUserId(teamId: String, userId: String): List<WorkLog>
    fun findAllBySessionId(sessionId: String): List<WorkLog>
    fun findPageByTeamId(
        teamId: String,
        statuses: List<WorkLogStatus>?,
        priorities: List<WorkLogPriority>?,
        assigneeUserId: String?,
        search: String?,
        dueBefore: LocalDate?,
        pageable: Pageable
    ): Page<WorkLog>
    fun save(workLog: WorkLog): WorkLog
    fun delete(workLog: WorkLog)
}
