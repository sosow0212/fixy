package com.fixy.house.agent.domain

import com.fixy.house.agent.domain.vo.AgentStatus
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import java.time.Instant

class AgentTest : DescribeSpec({

    describe("Agent init") {
        it("유효한 입력으로 생성된다") {
            val agent = Agent(
                teamId = "t1",
                name = "fixy-1",
                status = AgentStatus.ACTIVE,
                agentKeyHash = "hash",
                agentKeyLastFour = "abcd",
                createdByUserId = "u1"
            )
            agent.name shouldBe "fixy-1"
            agent.status shouldBe AgentStatus.ACTIVE
            agent.lastConnectedAt shouldBe null
        }

        it("빈 이름이면 실패") {
            shouldThrow<IllegalArgumentException> {
                Agent(
                    teamId = "t1",
                    name = "",
                    status = AgentStatus.ACTIVE,
                    agentKeyHash = "h",
                    agentKeyLastFour = "abcd",
                    createdByUserId = "u1"
                )
            }
        }

        it("50자 초과 이름이면 실패") {
            shouldThrow<IllegalArgumentException> {
                Agent(
                    teamId = "t1",
                    name = "a".repeat(51),
                    status = AgentStatus.ACTIVE,
                    agentKeyHash = "h",
                    agentKeyLastFour = "abcd",
                    createdByUserId = "u1"
                )
            }
        }

        it("lastFour 가 4자가 아니면 실패") {
            shouldThrow<IllegalArgumentException> {
                Agent(
                    teamId = "t1",
                    name = "fixy-1",
                    status = AgentStatus.ACTIVE,
                    agentKeyHash = "h",
                    agentKeyLastFour = "abc",
                    createdByUserId = "u1"
                )
            }
        }

        it("빈 createdByUserId 면 실패") {
            shouldThrow<IllegalArgumentException> {
                Agent(
                    teamId = "t1",
                    name = "fixy-1",
                    status = AgentStatus.ACTIVE,
                    agentKeyHash = "h",
                    agentKeyLastFour = "abcd",
                    createdByUserId = ""
                )
            }
        }
    }

    describe("Agent.rename") {
        it("이름이 변경된다") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "h", agentKeyLastFour = "abcd", createdByUserId = "u1"
            )
            agent.rename("fixy-2")
            agent.name shouldBe "fixy-2"
        }

        it("빈 이름으로 변경 시도하면 실패") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "h", agentKeyLastFour = "abcd", createdByUserId = "u1"
            )
            shouldThrow<IllegalArgumentException> { agent.rename("") }
        }
    }

    describe("Agent 상태 변경") {
        it("disable / activate 토글") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "h", agentKeyLastFour = "abcd", createdByUserId = "u1"
            )
            agent.disable()
            agent.status shouldBe AgentStatus.DISABLED
            agent.activate()
            agent.status shouldBe AgentStatus.ACTIVE
        }

        it("changeStatus 직접 변경") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "h", agentKeyLastFour = "abcd", createdByUserId = "u1"
            )
            agent.changeStatus(AgentStatus.DISABLED)
            agent.status shouldBe AgentStatus.DISABLED
        }
    }

    describe("Agent.rotateKey") {
        it("해시와 마지막 4자리가 갱신된다") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "old", agentKeyLastFour = "old1", createdByUserId = "u1"
            )
            agent.rotateKey("new-hash", "wxyz")
            agent.agentKeyHash shouldBe "new-hash"
            agent.agentKeyLastFour shouldBe "wxyz"
        }

        it("빈 해시로 회전 시도하면 실패") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "old", agentKeyLastFour = "old1", createdByUserId = "u1"
            )
            shouldThrow<IllegalArgumentException> { agent.rotateKey("", "abcd") }
        }

        it("4자 아닌 마지막 자리로 회전 시도하면 실패") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "old", agentKeyLastFour = "old1", createdByUserId = "u1"
            )
            shouldThrow<IllegalArgumentException> { agent.rotateKey("new", "abc") }
        }
    }

    describe("Agent.markConnected") {
        it("lastConnectedAt 이 갱신된다") {
            val agent = Agent(
                teamId = "t1", name = "fixy-1", status = AgentStatus.ACTIVE,
                agentKeyHash = "h", agentKeyLastFour = "abcd", createdByUserId = "u1"
            )
            val now = Instant.parse("2026-01-01T00:00:00Z")
            agent.markConnected(now)
            agent.lastConnectedAt shouldBe now
        }
    }
})
