package com.fixy.house.team.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size

data class UpdateTeamRequest(
    @field:Schema(description = "변경할 팀 이름", example = "Fixy Studio")
    @field:Size(min = 1, max = 50)
    val name: String? = null,

    @field:Schema(description = "변경할 팀 설명")
    val description: String? = null
)
