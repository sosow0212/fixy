package com.fixy.house.user.application.dto.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class UpdateProfileRequest(
    @field:Schema(description = "변경할 표시 이름", example = "Fixy")
    @field:NotBlank
    @field:Size(min = 2, max = 30)
    val displayName: String
)
