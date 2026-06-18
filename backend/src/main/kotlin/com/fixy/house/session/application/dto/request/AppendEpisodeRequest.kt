package com.fixy.house.session.application.dto.request

import com.fixy.house.session.domain.vo.Signal
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant

data class AppendEpisodeRequest(
    @field:Schema(description = "fixy-agent L1 episode id", example = "mqi28h9l-y5f-1-41gx")
    @field:NotBlank
    val episodeId: String,

    @field:Schema(description = "에피소드 시각 (에이전트 시계)")
    @field:NotNull
    val ts: Instant,

    @field:Schema(description = "시그널 (complaint/correction/insight/success/note)")
    @field:NotNull
    val signal: Signal,

    @field:Schema(description = "프롬프트 요약 (에이전트가 redact 한 값)")
    @field:NotBlank
    val summary: String,

    @field:Schema(description = "추출된 태그")
    val tags: List<String> = emptyList(),

    @field:Schema(description = "만진 파일 경로 목록")
    val files: List<String> = emptyList(),

    @field:Schema(description = "프로젝트 이름")
    val projectName: String? = null,

    @field:Schema(description = "L2 승급된 스킬 이름 (있다면)")
    val promotedTo: String? = null
)
