package com.fixy.house.team.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateTeamRequest(
    @field:Schema(description = "팀 이름", example = "Fixy")
    @field:NotBlank
    @field:Size(min = 1, max = 50)
    val name: String,

    @field:Schema(description = "팀 설명", example = "픽시 작업실")
    val description: String? = null,

    @field:Schema(description = "팀 슬러그 (선택). 미지정 시 이름에서 자동 생성.", example = "fixy")
    val slug: String? = null
)
