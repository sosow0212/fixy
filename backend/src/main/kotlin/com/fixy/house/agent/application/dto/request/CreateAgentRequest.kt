package com.fixy.house.agent.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateAgentRequest(
    @field:Schema(description = "에이전트 이름", example = "fixy-dev-1")
    @field:NotBlank
    @field:Size(min = 1, max = 50)
    val name: String
)
