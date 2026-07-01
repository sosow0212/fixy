package com.fixy.house.worklog.application.dto.request

import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class UpdateWorkLogRequest(
    @field:Schema(description = "변경할 제목")
    @field:Size(max = 200)
    val title: String? = null,

    @field:Schema(description = "변경할 설명 (null = 유지, 빈 문자열 = 비우기)")
    val description: String? = null,

    @field:Schema(description = "변경할 상태")
    val status: WorkLogStatus? = null,

    @field:Schema(description = "변경할 우선순위")
    val priority: WorkLogPriority? = null,

    @field:Schema(description = "변경할 태그 목록")
    val tags: List<String>? = null,

    @field:Schema(description = "변경할 마감일")
    val dueDate: LocalDate? = null
)
