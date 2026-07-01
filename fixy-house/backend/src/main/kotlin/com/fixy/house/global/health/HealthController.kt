package com.fixy.house.global.health

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@Tag(name = "Health", description = "서버 상태 확인")
@RestController
@RequestMapping("/api/v1/health")
class HealthController {

    @Operation(summary = "헬스 체크")
    @GetMapping("/check")
    fun check(): ResponseEntity<Map<String, Any>> =
        ResponseEntity.ok(
            mapOf(
                "status" to "UP",
                "service" to "fixy-house",
                "time" to Instant.now().toString()
            )
        )
}
