package com.fixy.house.worklog.application.dto.request

import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class CreateWorkLogRequest(
    @field:Schema(description = "작업 제목", example = "주간 보고 작성")
    @field:NotBlank
    @field:Size(max = 200)
    val title: String,

    @field:Schema(description = "작업 설명 (Markdown)")
    val description: String? = null,

    @field:Schema(description = "초기 상태 (생략 시 TODO)")
    val status: WorkLogStatus? = null,

    @field:Schema(description = "우선순위 (생략 시 MEDIUM)")
    val priority: WorkLogPriority? = null,

    @field:Schema(description = "태그 목록")
    val tags: List<String> = emptyList(),

    @field:Schema(description = "마감일 (YYYY-MM-DD)")
    val dueDate: LocalDate? = null,

    @field:Schema(description = "상위 작업 로그 ID (서브 태스크)")
    val parentId: String? = null,

    @field:Schema(description = "관련 세션 ID (에이전트 세션)")
    val sessionId: String? = null,

    @field:Schema(description = "담당자 userId (생략 시 작성자)")
    val assigneeUserId: String? = null
)
