package com.fixy.house.agent.application.service

import com.fixy.house.agent.application.dto.request.CreateAgentRequest
import com.fixy.house.agent.application.dto.request.UpdateAgentRequest
import com.fixy.house.agent.domain.Agent
import com.fixy.house.agent.domain.AgentRepository
import com.fixy.house.agent.domain.exception.AgentExceptionType
import com.fixy.house.agent.domain.policy.AgentKeyGenerator
import com.fixy.house.agent.domain.vo.AgentStatus
import com.fixy.house.global.exceptions.CustomException
import com.fixy.house.team.application.service.TeamService
import com.fixy.house.team.domain.vo.TeamRole
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.springframework.security.crypto.password.PasswordEncoder

class AgentServiceTest : DescribeSpec({

    val agentRepository = mockk<AgentRepository>(relaxed = true)
    val teamService = mockk<TeamService>(relaxed = true)
    val agentKeyGenerator = mockk<AgentKeyGenerator>(relaxed = true)
    val passwordEncoder = mockk<PasswordEncoder>(relaxed = true)
    val agentService = AgentService(agentRepository, teamService, agentKeyGenerator, passwordEncoder)

    beforeTest {
        clearMocks(agentRepository, teamService, agentKeyGenerator, passwordEncoder)
    }

    describe("createAgent") {
        it("MANAGER+ 가 에이전트 생성 시 평문 키 1회 반환") {
            val request = CreateAgentRequest(name = "fixy-1")
            every { teamService.requireRoleAtLeast("u1", "t1", TeamRole.MANAGER) } returns Unit
            every { agentRepository.existsByTeamIdAndName("t1", "fixy-1") } returns false
            every { agentKeyGenerator.generateRawKey() } returns "fixy_RAW"
            every { agentKeyGenerator.lastFourOf("fixy_RAW") } returns "_RAW"
            every { passwordEncoder.encode("fixy_RAW") } returns "hashed"
            every { agentRepository.save(any()) } answers { firstArg<Agent>().apply { id = "a1" } }

            val result = agentService.createAgent("u1", "t1", request)

            result.agentKey shouldBe "fixy_RAW"
            result.agent.name shouldBe "fixy-1"
            result.agent.status shouldBe "ACTIVE"
            result.agent.agentKeyLastFour shouldBe "_RAW"
            verify { agentRepository.save(match { it.name == "fixy-1" && it.agentKeyHash == "hashed" && it.createdByUserId == "u1" }) }
        }

        it("이름이 이미 존재하면 AGENT_NAME_ALREADY_IN_USE") {
            val request = CreateAgentRequest(name = "fixy-1")
            every { teamService.requireRoleAtLeast("u1", "t1", TeamRole.MANAGER) } returns Unit
            every { agentRepository.existsByTeamIdAndName("t1", "fixy-1") } returns true

            val ex = shouldThrow<CustomException> { agentService.createAgent("u1", "t1", request) }
            ex.getExceptionType() shouldBe AgentExceptionType.AGENT_NAME_ALREADY_IN_USE
        }
    }

    describe("rotateKey") {
        it("MANAGER+ 가 키를 회전하면 새 평문이 1회 반환된다") {
            val agent = Agent(
                id = "a1",
                teamId = "t1",
                name = "fixy-1",
                status = AgentStatus.ACTIVE,
                agentKeyHash = "old",
                agentKeyLastFour = "old1",
                createdByUserId = "u1"
            )
            every { agentRepository.findById("a1") } returns agent
            every { teamService.requireRoleAtLeast("u1", "t1", TeamRole.MANAGER) } returns Unit
            every { agentKeyGenerator.generateRawKey() } returns "fixy_NEW"
            every { agentKeyGenerator.lastFourOf("fixy_NEW") } returns "_NEW"
            every { passwordEncoder.encode("fixy_NEW") } returns "new-hash"
            every { agentRepository.save(any()) } answers { firstArg<Agent>() }

            val result = agentService.rotateKey("u1", "a1")

            result.agentKey shouldBe "fixy_NEW"
            result.agent.agentKeyLastFour shouldBe "_NEW"
            agent.agentKeyHash shouldBe "new-hash"
        }
    }

    describe("authenticateByKey") {
        it("ACTIVE 에이전트 중 BCrypt 매치되는 것이 있으면 그 에이전트 반환") {
            val a1 = Agent(
                id = "a1", teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "hash1", agentKeyLastFour = "1111", createdByUserId = "u1"
            )
            val a2 = Agent(
                id = "a2", teamId = "t1", name = "fixy-2", status = AgentStatus.ACTIVE,
                agentKeyHash = "hash2", agentKeyLastFour = "2222", createdByUserId = "u1"
            )
            every { agentRepository.findAllByStatus(AgentStatus.ACTIVE) } returns listOf(a1, a2)
            every { passwordEncoder.matches("raw", "hash1") } returns false
            every { passwordEncoder.matches("raw", "hash2") } returns true
            every { agentRepository.save(any()) } answers { firstArg<Agent>() }

            val result = agentService.authenticateByKey("raw")
            result.id shouldBe "a2"
            result.lastConnectedAt shouldNotBe null
        }

        it("매치되는 게 없으면 INVALID_AGENT_KEY") {
            val a1 = Agent(
                id = "a1", teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "hash1", agentKeyLastFour = "1111", createdByUserId = "u1"
            )
            every { agentRepository.findAllByStatus(AgentStatus.ACTIVE) } returns listOf(a1)
            every { passwordEncoder.matches("raw", "hash1") } returns false

            val ex = shouldThrow<CustomException> { agentService.authenticateByKey("raw") }
            ex.getExceptionType() shouldBe AgentExceptionType.INVALID_AGENT_KEY
        }

        it("DISABLED 에이전트는 매치 대상이 아니다") {
            val disabled = Agent(
                id = "a1", teamId = "t1", name = "fixy-1", status = AgentStatus.DISABLED,
                agentKeyHash = "hash1", agentKeyLastFour = "1111", createdByUserId = "u1"
            )
            every { agentRepository.findAllByStatus(AgentStatus.ACTIVE) } returns emptyList()

            val ex = shouldThrow<CustomException> { agentService.authenticateByKey("raw") }
            ex.getExceptionType() shouldBe AgentExceptionType.INVALID_AGENT_KEY
            verify(exactly = 0) { passwordEncoder.matches(any(), disabled.agentKeyHash) }
        }
    }

    describe("deleteAgent") {
        it("OWNER 가 삭제 가능") {
            val agent = Agent(
                id = "a1", teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "h", agentKeyLastFour = "abcd", createdByUserId = "u1"
            )
            every { agentRepository.findById("a1") } returns agent
            every { teamService.requireRoleAtLeast("u1", "t1", TeamRole.OWNER) } returns Unit

            agentService.deleteAgent("u1", "a1")
            verify { agentRepository.delete(agent) }
        }
    }

    describe("updateAgent") {
        it("이름/상태가 모두 갱신된다") {
            val agent = Agent(
                id = "a1", teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "h", agentKeyLastFour = "abcd", createdByUserId = "u1"
            )
            every { agentRepository.findById("a1") } returns agent
            every { teamService.requireRoleAtLeast("u1", "t1", TeamRole.MANAGER) } returns Unit
            every { agentRepository.save(any()) } answers { firstArg<Agent>() }

            val result = agentService.updateAgent(
                "u1", "a1",
                UpdateAgentRequest(name = "fixy-1-renamed", status = AgentStatus.DISABLED)
            )

            result.name shouldBe "fixy-1-renamed"
            result.status shouldBe "DISABLED"
        }
    }
})
