package com.fixy.house.team.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.team.application.dto.request.CreateTeamRequest
import com.fixy.house.team.domain.Team
import com.fixy.house.team.domain.TeamMember
import com.fixy.house.team.domain.TeamMemberRepository
import com.fixy.house.team.domain.TeamRepository
import com.fixy.house.team.domain.exception.TeamExceptionType
import com.fixy.house.team.domain.vo.TeamRole
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import java.time.Instant

class TeamServiceTest : DescribeSpec({

    val teamRepository = mockk<TeamRepository>(relaxed = true)
    val teamMemberRepository = mockk<TeamMemberRepository>(relaxed = true)
    val teamService = TeamService(teamRepository, teamMemberRepository)

    beforeTest {
        clearMocks(teamRepository, teamMemberRepository)
    }

    describe("createTeam") {
        it("팀을 생성하고 OWNER 멤버를 추가한다") {
            val request = CreateTeamRequest(name = "Fixy", description = "d", slug = null)
            every { teamRepository.existsBySlug("fixy") } returns false
            every { teamRepository.save(any()) } answers {
                val t = firstArg<Team>()
                t.id = "team-1"
                t
            }
            every { teamMemberRepository.save(any()) } answers {
                val m = firstArg<TeamMember>()
                m.id = "m-1"
                m
            }

            val result = teamService.createTeam("u1", request)

            result.name shouldBe "Fixy"
            result.slug shouldBe "fixy"
            result.myRole shouldBe "OWNER"
            verify { teamMemberRepository.save(match { it.userId == "u1" && it.role == TeamRole.OWNER }) }
        }

        it("슬러그 충돌 시 예외를 던진다") {
            every { teamRepository.existsBySlug("fixy") } returns true

            val ex = shouldThrow<CustomException> {
                teamService.createTeam("u1", CreateTeamRequest(name = "Fixy"))
            }
            ex.getExceptionType() shouldBe TeamExceptionType.TEAM_SLUG_ALREADY_IN_USE
        }

        it("요청에 slug 가 있으면 그대로 사용한다") {
            val request = CreateTeamRequest(name = "Fixy Studio", slug = "custom-slug")
            every { teamRepository.existsBySlug("custom-slug") } returns false
            every { teamRepository.save(any()) } answers {
                val t = firstArg<Team>(); t.id = "team-1"; t
            }
            every { teamMemberRepository.save(any()) } answers {
                val m = firstArg<TeamMember>(); m.id = "m-1"; m
            }

            val result = teamService.createTeam("u1", request)
            result.slug shouldBe "custom-slug"
        }
    }

    describe("getMyTeams") {
        it("유저가 속한 팀들을 myRole 과 함께 반환한다") {
            val team1 = Team(id = "t1", name = "Fixy1", slug = "fixy1", ownerUserId = "u1")
            val team2 = Team(id = "t2", name = "Fixy2", slug = "fixy2", ownerUserId = "u9")
            every { teamMemberRepository.findAllByUserId("u1") } returns listOf(
                TeamMember(id = "m1", teamId = "t1", userId = "u1", role = TeamRole.OWNER, joinedAt = Instant.now()),
                TeamMember(id = "m2", teamId = "t2", userId = "u1", role = TeamRole.MEMBER, joinedAt = Instant.now())
            )
            every { teamRepository.findById("t1") } returns team1
            every { teamRepository.findById("t2") } returns team2

            val result = teamService.getMyTeams("u1")
            result.size shouldBe 2
            result.any { it.id == "t1" && it.myRole == "OWNER" } shouldBe true
            result.any { it.id == "t2" && it.myRole == "MEMBER" } shouldBe true
        }
    }

    describe("changeMemberRole") {
        it("MANAGER+ 가 MEMBER 를 MANAGER 로 승격") {
            val team = Team(id = "t1", name = "Fixy", slug = "fixy", ownerUserId = "u1")
            val actor = TeamMember(id = "m0", teamId = "t1", userId = "u1", role = TeamRole.OWNER, joinedAt = Instant.now())
            val target = TeamMember(id = "m1", teamId = "t1", userId = "u2", role = TeamRole.MEMBER, joinedAt = Instant.now())
            every { teamRepository.findById("t1") } returns team
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u1") } returns actor
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u2") } returns target
            every { teamMemberRepository.save(any()) } answers { firstArg() }

            val result = teamService.changeMemberRole("u1", "t1", "u2", TeamRole.MANAGER)
            result.role shouldBe "MANAGER"
            verify { teamMemberRepository.save(match { it.role == TeamRole.MANAGER }) }
        }

        it("마지막 OWNER 를 강등하려고 하면 실패") {
            val team = Team(id = "t1", name = "Fixy", slug = "fixy", ownerUserId = "u1")
            val target = TeamMember(id = "m1", teamId = "t1", userId = "u1", role = TeamRole.OWNER, joinedAt = Instant.now())
            every { teamRepository.findById("t1") } returns team
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u1") } returns target
            every { teamMemberRepository.countByTeamIdAndRoleIn("t1", listOf(TeamRole.OWNER)) } returns 1L

            val ex = shouldThrow<CustomException> {
                teamService.changeMemberRole("u1", "t1", "u1", TeamRole.MEMBER)
            }
            ex.getExceptionType() shouldBe TeamExceptionType.CANNOT_DEMOTE_LAST_OWNER
        }

        it("MEMBER 를 OWNER 로 승격 시 Team.ownerUserId 도 변경된다") {
            val team = Team(id = "t1", name = "Fixy", slug = "fixy", ownerUserId = "u1")
            val actor = TeamMember(id = "m0", teamId = "t1", userId = "u1", role = TeamRole.OWNER, joinedAt = Instant.now())
            val target = TeamMember(id = "m1", teamId = "t1", userId = "u2", role = TeamRole.MEMBER, joinedAt = Instant.now())
            every { teamRepository.findById("t1") } returns team
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u1") } returns actor
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u2") } returns target
            every { teamMemberRepository.save(any()) } answers { firstArg() }
            every { teamRepository.save(any()) } answers { firstArg() }

            teamService.changeMemberRole("u1", "t1", "u2", TeamRole.OWNER)
            verify { teamRepository.save(match { it.ownerUserId == "u2" }) }
        }
    }

    describe("removeMember") {
        it("마지막 OWNER 는 제거할 수 없다") {
            val team = Team(id = "t1", name = "Fixy", slug = "fixy", ownerUserId = "u1")
            val actor = TeamMember(id = "m0", teamId = "t1", userId = "u1", role = TeamRole.OWNER, joinedAt = Instant.now())
            val target = TeamMember(id = "m1", teamId = "t1", userId = "u1", role = TeamRole.OWNER, joinedAt = Instant.now())
            every { teamRepository.findById("t1") } returns team
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u1") } returns actor andThen target
            every { teamMemberRepository.countByTeamIdAndRoleIn("t1", listOf(TeamRole.OWNER)) } returns 1L

            val ex = shouldThrow<CustomException> {
                teamService.removeMember("u1", "t1", "u1")
            }
            ex.getExceptionType() shouldBe TeamExceptionType.CANNOT_REMOVE_OWN_OWNERSHIP
        }

        it("MEMBER 는 정상 제거된다") {
            val team = Team(id = "t1", name = "Fixy", slug = "fixy", ownerUserId = "u1")
            val actor = TeamMember(id = "m0", teamId = "t1", userId = "u1", role = TeamRole.OWNER, joinedAt = Instant.now())
            val target = TeamMember(id = "m1", teamId = "t1", userId = "u2", role = TeamRole.MEMBER, joinedAt = Instant.now())
            every { teamRepository.findById("t1") } returns team
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u1") } returns actor
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u2") } returns target

            teamService.removeMember("u1", "t1", "u2")
            verify { teamMemberRepository.deleteByTeamIdAndUserId("t1", "u2") }
        }
    }

    describe("requireRoleAtLeast") {
        it("권한이 부족하면 INSUFFICIENT_TEAM_ROLE") {
            val actor = TeamMember(id = "m1", teamId = "t1", userId = "u2", role = TeamRole.MEMBER, joinedAt = Instant.now())
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u2") } returns actor

            val ex = shouldThrow<CustomException> {
                teamService.requireRoleAtLeast("u2", "t1", TeamRole.OWNER)
            }
            ex.getExceptionType() shouldBe TeamExceptionType.INSUFFICIENT_TEAM_ROLE
        }

        it("멤버가 아니면 NOT_TEAM_MEMBER") {
            every { teamMemberRepository.findByTeamIdAndUserId("t1", "u9") } returns null

            val ex = shouldThrow<CustomException> {
                teamService.requireRoleAtLeast("u9", "t1", TeamRole.MEMBER)
            }
            ex.getExceptionType() shouldBe TeamExceptionType.NOT_TEAM_MEMBER
        }
    }
})
