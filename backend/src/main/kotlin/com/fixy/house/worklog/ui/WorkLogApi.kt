package com.fixy.house.worklog.ui

import com.fixy.house.global.security.AuthUser
import com.fixy.house.worklog.application.dto.request.CreateWorkLogRequest
import com.fixy.house.worklog.application.dto.request.UpdateWorkLogRequest
import com.fixy.house.worklog.application.dto.response.WorkLogSummaryResponse
import com.fixy.house.worklog.application.service.WorkLogService
import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@Tag(name = "Worklogs", description = "작업 로그 (팀 단위)")
@RestController
@RequestMapping("/api/v1")
class WorkLogApi(private val workLogService: WorkLogService) {

    @Operation(summary = "팀 작업 로그 목록 조회 (필터/페이지)")
    @GetMapping("/teams/{teamId}/worklogs")
    fun listWorkLogs(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @RequestParam(required = false) statuses: List<WorkLogStatus>?,
        @RequestParam(required = false) priorities: List<WorkLogPriority>?,
        @RequestParam(required = false) assigneeUserId: String?,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dueBefore: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<WorkLogSummaryResponse>> =
        ResponseEntity.ok(
            workLogService.list(
                actorUserId = userId,
                teamId = teamId,
                statuses = statuses,
                priorities = priorities,
                assigneeUserId = assigneeUserId,
                search = search,
                dueBefore = dueBefore,
                page = page,
                size = size
            )
        )

    @Operation(summary = "작업 로그 생성")
    @PostMapping("/teams/{teamId}/worklogs")
    fun createWorkLog(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @Valid @RequestBody request: CreateWorkLogRequest
    ): ResponseEntity<WorkLogSummaryResponse> =
        ResponseEntity.ok(workLogService.create(userId, teamId, request))

    @Operation(summary = "작업 로그 단건 조회")
    @GetMapping("/worklogs/{workLogId}")
    fun getWorkLog(
        @AuthUser userId: String,
        @Parameter(description = "작업 로그 ID") @PathVariable workLogId: String
    ): ResponseEntity<WorkLogSummaryResponse> =
        ResponseEntity.ok(workLogService.get(userId, workLogId))

    @Operation(summary = "작업 로그 부분 수정")
    @PatchMapping("/worklogs/{workLogId}")
    fun updateWorkLog(
        @AuthUser userId: String,
        @PathVariable workLogId: String,
        @Valid @RequestBody request: UpdateWorkLogRequest
    ): ResponseEntity<WorkLogSummaryResponse> =
        ResponseEntity.ok(workLogService.update(userId, workLogId, request))

    @Operation(summary = "작업 로그 삭제")
    @DeleteMapping("/worklogs/{workLogId}")
    fun deleteWorkLog(
        @AuthUser userId: String,
        @PathVariable workLogId: String
    ): ResponseEntity<Void> {
        workLogService.delete(userId, workLogId)
        return ResponseEntity.noContent().build()
    }
}
