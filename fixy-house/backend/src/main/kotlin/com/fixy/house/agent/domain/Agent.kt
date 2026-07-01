package com.fixy.house.agent.domain

import com.fixy.house.agent.domain.vo.AgentStatus
import com.fixy.house.global.BaseEntity
import java.time.Instant

class Agent(
    var id: String? = null,
    var teamId: String,
    var name: String,
    var status: AgentStatus,
    var agentKeyHash: String,
    var agentKeyLastFour: String,
    var lastConnectedAt: Instant? = null,
    var createdByUserId: String
) : BaseEntity() {

    init {
        require(teamId.isNotBlank()) { "팀 ID 는 비어 있을 수 없습니다." }
        require(name.isNotBlank()) { "에이전트 이름은 비어 있을 수 없습니다." }
        require(name.length <= MAX_NAME_LENGTH) { "에이전트 이름은 ${MAX_NAME_LENGTH}자 이하여야 합니다." }
        require(agentKeyHash.isNotBlank()) { "에이전트 키 해시는 비어 있을 수 없습니다." }
        require(agentKeyLastFour.length == 4) { "에이전트 키 마지막 4자리는 정확히 4자 여야 합니다." }
        require(createdByUserId.isNotBlank()) { "생성자 사용자 ID 는 비어 있을 수 없습니다." }
    }

    fun rename(newName: String) {
        require(newName.isNotBlank()) { "에이전트 이름은 비어 있을 수 없습니다." }
        require(newName.length <= MAX_NAME_LENGTH) { "에이전트 이름은 ${MAX_NAME_LENGTH}자 이하여야 합니다." }
        this.name = newName
    }

    fun disable() {
        this.status = AgentStatus.DISABLED
    }

    fun activate() {
        this.status = AgentStatus.ACTIVE
    }

    fun changeStatus(newStatus: AgentStatus) {
        this.status = newStatus
    }

    fun rotateKey(newKeyHash: String, newKeyLastFour: String) {
        require(newKeyHash.isNotBlank()) { "새 에이전트 키 해시는 비어 있을 수 없습니다." }
        require(newKeyLastFour.length == 4) { "새 에이전트 키 마지막 4자리는 정확히 4자 여야 합니다." }
        this.agentKeyHash = newKeyHash
        this.agentKeyLastFour = newKeyLastFour
    }

    fun markConnected(now: Instant) {
        this.lastConnectedAt = now
    }

    companion object {
        private const val MAX_NAME_LENGTH = 50
    }
}
