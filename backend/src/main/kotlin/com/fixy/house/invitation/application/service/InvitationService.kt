package com.fixy.house.invitation.application.service

import com.fixy.house.global.exceptions.CommonExceptionType
import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.global.security.JwtProvider
import com.fixy.house.invitation.application.dto.request.AcceptInvitationRequest
import com.fixy.house.invitation.application.dto.request.InviteMemberRequest
import com.fixy.house.invitation.application.dto.response.AcceptInvitationResponse
import com.fixy.house.invitation.application.dto.response.InvitationResponse
import com.fixy.house.invitation.domain.Invitation
import com.fixy.house.invitation.domain.InvitationRepository
import com.fixy.house.invitation.domain.exception.InvitationExceptionType
import com.fixy.house.invitation.domain.policy.InvitationTokenGenerator
import com.fixy.house.invitation.domain.vo.InvitationStatus
import com.fixy.house.team.application.service.TeamService
import com.fixy.house.team.domain.TeamMember
import com.fixy.house.team.domain.TeamMemberRepository
import com.fixy.house.team.domain.vo.TeamRole
import com.fixy.house.user.domain.User
import com.fixy.house.user.domain.UserRepository
import com.fixy.house.user.domain.vo.DisplayName
import com.fixy.house.user.domain.vo.Email
import com.fixy.house.user.domain.vo.RawPassword
import com.fixy.house.user.infrastructure.policy.PasswordHasher
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

@Service
class InvitationService(
    private val invitationRepository: InvitationRepository,
    private val userRepository: UserRepository,
    private val teamMemberRepository: TeamMemberRepository,
    private val teamService: TeamService,
    private val tokenGenerator: InvitationTokenGenerator,
    private val passwordHasher: PasswordHasher,
    private val jwtProvider: JwtProvider
) {

    private val log = LoggerFactory.getLogger(this::class.java)

    @Transactional
    fun createInvitation(
        actorUserId: String,
        teamId: String,
        request: InviteMemberRequest
    ): InvitationResponse {
        teamService.requireRoleAtLeast(actorUserId, teamId, TeamRole.MANAGER)
        val normalizedEmail = Email.of(request.email).value
        if (invitationRepository.findAllByInvitedEmailAndStatus(
                normalizedEmail,
                InvitationStatus.PENDING
            ).any { it.teamId == teamId && it.expiresAt.isAfter(Instant.now()) }
        ) {
            throw CustomException(InvitationExceptionType.INVITATION_ALREADY_USED)
        }
        val rawToken = tokenGenerator.generateRawToken()
        val tokenHash = tokenGenerator.hashToken(rawToken)
        val expiresAt = Instant.now().plus(INVITATION_TTL)
        val invitation = invitationRepository.save(
            Invitation(
                teamId = teamId,
                invitedEmail = normalizedEmail,
                role = request.role,
                tokenHash = tokenHash,
                status = InvitationStatus.PENDING,
                invitedByUserId = actorUserId,
                expiresAt = expiresAt
            )
        )
        log.info(
            "Invitation created: id={}, email={}, teamId={}, role={}",
            invitation.id, normalizedEmail, teamId, request.role
        )
        return InvitationResponse.from(invitation, rawToken)
    }

    @Transactional(readOnly = true)
    fun listInvitations(actorUserId: String, teamId: String): List<InvitationResponse> {
        teamService.requireMember(actorUserId, teamId)
        return invitationRepository.findAllByTeamId(teamId)
            .map { InvitationResponse.from(it, null) }
            .sortedByDescending { it.createdAt }
    }

    @Transactional
    fun revoke(actorUserId: String, teamId: String, invitationId: String) {
        teamService.requireRoleAtLeast(actorUserId, teamId, TeamRole.MANAGER)
        val invitation = invitationRepository.findById(invitationId)
            ?: throw CustomException(InvitationExceptionType.INVITATION_NOT_FOUND)
        if (invitation.teamId != teamId) {
            throw CustomException(InvitationExceptionType.INVITATION_NOT_FOUND)
        }
        invitation.revoke()
        invitationRepository.save(invitation)
    }

    @Transactional
    fun acceptInvitation(request: AcceptInvitationRequest): AcceptInvitationResponse {
        val tokenHash = tokenGenerator.hashToken(request.token)
        val invitation = invitationRepository.findByTokenHash(tokenHash)
            ?: throw CustomException(InvitationExceptionType.INVITATION_NOT_FOUND)

        when (invitation.status) {
            InvitationStatus.ACCEPTED -> throw CustomException(InvitationExceptionType.INVITATION_ALREADY_USED)
            InvitationStatus.REVOKED -> throw CustomException(InvitationExceptionType.INVITATION_REVOKED)
            InvitationStatus.EXPIRED -> throw CustomException(InvitationExceptionType.INVITATION_EXPIRED)
            InvitationStatus.PENDING -> { /* ok */ }
        }

        val now = Instant.now()
        if (now.isAfter(invitation.expiresAt)) {
            invitation.markExpired(now)
            invitationRepository.save(invitation)
            throw CustomException(InvitationExceptionType.INVITATION_EXPIRED)
        }

        val normalizedEmail = Email.of(request.email).value
        if (invitation.invitedEmail != normalizedEmail) {
            throw CustomException(InvitationExceptionType.INVITATION_EMAIL_MISMATCH)
        }

        val (user, isNew) = if (userRepository.existsByEmail(normalizedEmail)) {
            userRepository.findByEmail(normalizedEmail)!! to false
        } else {
            val rawPassword = request.password
                ?: throw CustomException(CommonExceptionType.BAD_REQUEST, "신규 사용자는 비밀번호가 필요합니다.")
            val rawDisplayName = request.displayName
                ?: throw CustomException(CommonExceptionType.BAD_REQUEST, "신규 사용자는 표시 이름이 필요합니다.")
            val hashed = passwordHasher.hash(RawPassword.of(rawPassword).value)
            val displayName = DisplayName.of(rawDisplayName)
            val newUser = userRepository.save(
                User.create(Email.of(normalizedEmail), hashed, displayName)
            )
            newUser to true
        }

        val userId = user.id ?: error("저장된 사용자만 초대를 수락할 수 있습니다.")

        if (!teamMemberRepository.existsByTeamIdAndUserId(invitation.teamId, userId)) {
            teamMemberRepository.save(
                TeamMember(
                    teamId = invitation.teamId,
                    userId = userId,
                    role = invitation.role
                )
            )
        }

        invitation.accept(userId, now)
        invitationRepository.save(invitation)

        val accessToken = jwtProvider.generateAccessToken(userId, user.role)
        val refreshToken = jwtProvider.generateRefreshToken(userId)

        return AcceptInvitationResponse(
            newUser = isNew,
            accessToken = accessToken,
            refreshToken = refreshToken,
            userId = userId,
            teamId = invitation.teamId
        )
    }

    companion object {
        private val INVITATION_TTL: Duration = Duration.ofDays(7)
    }
}
