package com.fixy.house.worklog.application.dto.response

import com.fixy.house.worklog.domain.WorkLog
import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant
import java.time.LocalDate

data class WorkLogSummaryResponse(
    @Schema(description = "작업 로그 ID") val id: String,
    @Schema(description = "팀 ID") val teamId: String,
    @Schema(description = "작성자 userId") val userId: String,
    @Schema(description = "관련 세션 ID") val sessionId: String?,
    @Schema(description = "상위 작업 로그 ID") val parentId: String?,
    @Schema(description = "제목") val title: String,
    @Schema(description = "설명") val description: String?,
    @Schema(description = "상태") val status: WorkLogStatus,
    @Schema(description = "우선순위") val priority: WorkLogPriority,
    @Schema(description = "태그") val tags: List<String>,
    @Schema(description = "마감일") val dueDate: LocalDate?,
    @Schema(description = "완료 시각") val completedAt: Instant?,
    @Schema(description = "생성 시각") val createdAt: Instant?,
    @Schema(description = "수정 시각") val updatedAt: Instant?
) {
    companion object {
        fun from(workLog: WorkLog): WorkLogSummaryResponse = WorkLogSummaryResponse(
            id = workLog.id.orEmpty(),
            teamId = workLog.teamId,
            userId = workLog.userId,
            sessionId = workLog.sessionId,
            parentId = workLog.parentId,
            title = workLog.title,
            description = workLog.description,
            status = workLog.status,
            priority = workLog.priority,
            tags = workLog.tags,
            dueDate = workLog.dueDate,
            completedAt = workLog.completedAt,
            createdAt = workLog.createdAt,
            updatedAt = workLog.updatedAt
        )
    }
}
