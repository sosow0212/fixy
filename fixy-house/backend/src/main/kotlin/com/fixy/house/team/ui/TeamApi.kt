package com.fixy.house.team.ui

import com.fixy.house.global.security.AuthUser
import com.fixy.house.team.application.dto.request.ChangeMemberRoleRequest
import com.fixy.house.team.application.dto.request.CreateTeamRequest
import com.fixy.house.team.application.dto.request.UpdateTeamRequest
import com.fixy.house.team.application.dto.response.TeamMemberResponse
import com.fixy.house.team.application.dto.response.TeamSummaryResponse
import com.fixy.house.team.application.service.TeamService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Teams", description = "팀 / 멤버 관리")
@RestController
@RequestMapping("/api/v1/teams")
class TeamApi(private val teamService: TeamService) {

    @Operation(summary = "내가 속한 팀 목록")
    @GetMapping
    fun getMyTeams(@AuthUser userId: String): ResponseEntity<List<TeamSummaryResponse>> =
        ResponseEntity.ok(teamService.getMyTeams(userId))

    @Operation(summary = "팀 생성")
    @PostMapping
    fun createTeam(
        @AuthUser userId: String,
        @Valid @RequestBody request: CreateTeamRequest
    ): ResponseEntity<TeamSummaryResponse> =
        ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(userId, request))

    @Operation(summary = "팀 단건 조회")
    @GetMapping("/{teamId}")
    fun getTeam(
        @AuthUser userId: String,
        @PathVariable teamId: String
    ): ResponseEntity<TeamSummaryResponse> =
        ResponseEntity.ok(teamService.getTeam(userId, teamId))

    @Operation(summary = "팀 정보 수정 (MANAGER+)")
    @PatchMapping("/{teamId}")
    fun updateTeam(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @Valid @RequestBody request: UpdateTeamRequest
    ): ResponseEntity<TeamSummaryResponse> =
        ResponseEntity.ok(teamService.updateTeam(userId, teamId, request))

    @Operation(summary = "팀 삭제 (OWNER)")
    @DeleteMapping("/{teamId}")
    fun deleteTeam(
        @AuthUser userId: String,
        @PathVariable teamId: String
    ): ResponseEntity<Void> {
        teamService.deleteTeam(userId, teamId)
        return ResponseEntity.noContent().build()
    }

    @Operation(summary = "팀 멤버 목록")
    @GetMapping("/{teamId}/members")
    fun getMembers(
        @AuthUser userId: String,
        @PathVariable teamId: String
    ): ResponseEntity<List<TeamMemberResponse>> =
        ResponseEntity.ok(teamService.getMembers(userId, teamId))

    @Operation(summary = "멤버 권한 변경 (MANAGER+)")
    @PatchMapping("/{teamId}/members/{targetUserId}")
    fun changeMemberRole(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable targetUserId: String,
        @Valid @RequestBody request: ChangeMemberRoleRequest
    ): ResponseEntity<TeamMemberResponse> =
        ResponseEntity.ok(teamService.changeMemberRole(userId, teamId, targetUserId, request.role))

    @Operation(summary = "멤버 제거 (MANAGER+)")
    @DeleteMapping("/{teamId}/members/{targetUserId}")
    fun removeMember(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable targetUserId: String
    ): ResponseEntity<Void> {
        teamService.removeMember(userId, teamId, targetUserId)
        return ResponseEntity.noContent().build()
    }
}
