package com.fixy.house.agent.application.dto.request

import com.fixy.house.agent.domain.vo.AgentStatus
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size

data class UpdateAgentRequest(
    @field:Schema(description = "변경할 에이전트 이름", example = "fixy-dev-1-renamed")
    @field:Size(min = 1, max = 50)
    val name: String? = null,

    @field:Schema(description = "변경할 상태 (ACTIVE / DISABLED)")
    val status: AgentStatus? = null
)
