package com.fixy.house.worklog.infrastructure.repository

import com.fixy.house.worklog.infrastructure.entity.WorkLogEntity
import org.springframework.data.mongodb.repository.MongoRepository

interface WorkLogMongoRepository : MongoRepository<WorkLogEntity, String> {
    fun findByTeamIdAndId(teamId: String, id: String): WorkLogEntity?
    fun findAllByTeamId(teamId: String): List<WorkLogEntity>
    fun findAllByTeamIdAndUserId(teamId: String, userId: String): List<WorkLogEntity>
    fun findAllBySessionId(sessionId: String): List<WorkLogEntity>
}
