package com.fixy.house.invitation.application.service

import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.global.security.JwtProvider
import com.fixy.house.invitation.application.dto.request.AcceptInvitationRequest
import com.fixy.house.invitation.application.dto.request.InviteMemberRequest
import com.fixy.house.invitation.domain.Invitation
import com.fixy.house.invitation.domain.InvitationRepository
import com.fixy.house.invitation.domain.exception.InvitationExceptionType
import com.fixy.house.invitation.domain.policy.InvitationTokenGenerator
import com.fixy.house.invitation.domain.vo.InvitationStatus
import com.fixy.house.team.application.service.TeamService
import com.fixy.house.team.domain.TeamMemberRepository
import com.fixy.house.team.domain.vo.TeamRole
import com.fixy.house.user.domain.User
import com.fixy.house.user.domain.UserRepository
import com.fixy.house.user.domain.vo.UserRole
import com.fixy.house.user.infrastructure.policy.PasswordHasher
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import java.time.Instant

class InvitationServiceTest : DescribeSpec({

    val invitationRepository = mockk<InvitationRepository>(relaxed = true)
    val userRepository = mockk<UserRepository>(relaxed = true)
    val teamMemberRepository = mockk<TeamMemberRepository>(relaxed = true)
    val teamService = mockk<TeamService>(relaxed = true)
    val tokenGenerator = mockk<InvitationTokenGenerator>(relaxed = true)
    val passwordHasher = mockk<PasswordHasher>(relaxed = true)
    val jwtProvider = mockk<JwtProvider>(relaxed = true)

    val invitationService = InvitationService(
        invitationRepository,
        userRepository,
        teamMemberRepository,
        teamService,
        tokenGenerator,
        passwordHasher,
        jwtProvider
    )

    beforeTest {
        clearMocks(
            invitationRepository,
            userRepository,
            teamMemberRepository,
            teamService,
            tokenGenerator,
            passwordHasher,
            jwtProvider
        )
    }

    describe("createInvitation") {
        it("MANAGER+ 가 초대를 생성하고 토큰이 1회 반환된다") {
            val request = InviteMemberRequest(email = "newbie@example.com", role = TeamRole.MEMBER)
            every { teamService.requireRoleAtLeast("u1", "t1", TeamRole.MANAGER) } returns Unit
            every { invitationRepository.findAllByInvitedEmailAndStatus("newbie@example.com", InvitationStatus.PENDING) } returns emptyList()
            every { tokenGenerator.generateRawToken() } returns "raw-token"
            every { tokenGenerator.hashToken("raw-token") } returns "raw-hash"
            every { invitationRepository.save(any()) } answers { firstArg<Invitation>().apply { id = "i1" } }

            val result = invitationService.createInvitation("u1", "t1", request)

            result.token shouldBe "raw-token"
            result.id shouldBe "i1"
            result.status shouldBe "PENDING"
            verify { invitationRepository.save(match { it.tokenHash == "raw-hash" && it.status == InvitationStatus.PENDING }) }
        }
    }

    describe("acceptInvitation") {
        it("신규 사용자는 비밀번호/표시이름으로 가입되고 팀 멤버가 된다") {
            val now = Instant.now()
            val invitation = Invitation(
                id = "i1",
                teamId = "t1",
                invitedEmail = "newbie@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "raw-hash",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = now.plusSeconds(3600)
            )
            every { tokenGenerator.hashToken("raw-token") } returns "raw-hash"
            every { invitationRepository.findByTokenHash("raw-hash") } returns invitation
            every { userRepository.existsByEmail("newbie@example.com") } returns false
            every { passwordHasher.hash("Password1!") } returns "hashed"
            every { userRepository.save(any()) } answers {
                firstArg<User>().apply { id = "new-user-id" }
            }
            every { teamMemberRepository.existsByTeamIdAndUserId("t1", "new-user-id") } returns false
            every { teamMemberRepository.save(any()) } answers { firstArg() }
            every { invitationRepository.save(any()) } answers { firstArg() }
            every { jwtProvider.generateAccessToken("new-user-id", UserRole.USER) } returns "access"
            every { jwtProvider.generateRefreshToken("new-user-id") } returns "refresh"

            val request = AcceptInvitationRequest(
                token = "raw-token",
                email = "newbie@example.com",
                password = "Password1!",
                displayName = "Newbie"
            )
            val result = invitationService.acceptInvitation(request)

            result.newUser shouldBe true
            result.userId shouldBe "new-user-id"
            result.teamId shouldBe "t1"
            result.accessToken shouldBe "access"
            result.refreshToken shouldBe "refresh"
            verify { userRepository.save(match { it.email == "newbie@example.com" }) }
            verify { teamMemberRepository.save(match { it.teamId == "t1" && it.userId == "new-user-id" && it.role == TeamRole.MEMBER }) }
        }

        it("기존 사용자는 가입 없이 팀 멤버로 추가된다") {
            val now = Instant.now()
            val invitation = Invitation(
                id = "i1",
                teamId = "t1",
                invitedEmail = "existing@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "raw-hash",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = now.plusSeconds(3600)
            )
            val existing = User(
                id = "existing-user-id",
                email = "existing@example.com",
                passwordHash = "h",
                displayName = "Existing"
            )
            every { tokenGenerator.hashToken("raw-token") } returns "raw-hash"
            every { invitationRepository.findByTokenHash("raw-hash") } returns invitation
            every { userRepository.existsByEmail("existing@example.com") } returns true
            every { userRepository.findByEmail("existing@example.com") } returns existing
            every { teamMemberRepository.existsByTeamIdAndUserId("t1", "existing-user-id") } returns true
            every { invitationRepository.save(any()) } answers { firstArg() }
            every { jwtProvider.generateAccessToken("existing-user-id", UserRole.USER) } returns "access"
            every { jwtProvider.generateRefreshToken("existing-user-id") } returns "refresh"

            val request = AcceptInvitationRequest(
                token = "raw-token",
                email = "existing@example.com"
            )
            val result = invitationService.acceptInvitation(request)

            result.newUser shouldBe false
            result.userId shouldBe "existing-user-id"
            verify(exactly = 0) { userRepository.save(any()) }
            verify(exactly = 0) { teamMemberRepository.save(any()) }
        }

        it("토큰이 매치되지 않으면 INVITATION_NOT_FOUND") {
            every { tokenGenerator.hashToken("bad") } returns "bad-hash"
            every { invitationRepository.findByTokenHash("bad-hash") } returns null

            val ex = shouldThrow<CustomException> {
                invitationService.acceptInvitation(
                    AcceptInvitationRequest(token = "bad", email = "a@b.com")
                )
            }
            ex.getExceptionType() shouldBe InvitationExceptionType.INVITATION_NOT_FOUND
        }

        it("만료된 초대면 INVITATION_EXPIRED") {
            val now = Instant.now()
            val invitation = Invitation(
                id = "i1",
                teamId = "t1",
                invitedEmail = "a@b.com",
                role = TeamRole.MEMBER,
                tokenHash = "raw-hash",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = now.minusSeconds(10)
            )
            every { tokenGenerator.hashToken("raw-token") } returns "raw-hash"
            every { invitationRepository.findByTokenHash("raw-hash") } returns invitation
            every { invitationRepository.save(any()) } answers { firstArg() }

            val ex = shouldThrow<CustomException> {
                invitationService.acceptInvitation(
                    AcceptInvitationRequest(token = "raw-token", email = "a@b.com")
                )
            }
            ex.getExceptionType() shouldBe InvitationExceptionType.INVITATION_EXPIRED
        }

        it("이메일이 일치하지 않으면 INVITATION_EMAIL_MISMATCH") {
            val now = Instant.now().plusSeconds(3600)
            val invitation = Invitation(
                id = "i1",
                teamId = "t1",
                invitedEmail = "expected@example.com",
                role = TeamRole.MEMBER,
                tokenHash = "raw-hash",
                status = InvitationStatus.PENDING,
                invitedByUserId = "u9",
                expiresAt = now
            )
            every { tokenGenerator.hashToken("raw-token") } returns "raw-hash"
            every { invitationRepository.findByTokenHash("raw-hash") } returns invitation

            val ex = shouldThrow<CustomException> {
                invitationService.acceptInvitation(
                    AcceptInvitationRequest(token = "raw-token", email = "different@example.com")
                )
            }
            ex.getExceptionType() shouldBe InvitationExceptionType.INVITATION_EMAIL_MISMATCH
        }
    }
})
