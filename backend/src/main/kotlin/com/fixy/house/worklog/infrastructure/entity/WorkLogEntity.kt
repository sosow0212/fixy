package com.fixy.house.worklog.infrastructure.entity

import com.fixy.house.global.MongoAuditableEntity
import com.fixy.house.worklog.domain.WorkLog
import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field
import java.time.Instant
import java.time.LocalDate

@Document(collection = "worklogs")
@CompoundIndexes(
    CompoundIndex(name = "team_status", def = "{'team_id': 1, 'status': 1}"),
    CompoundIndex(name = "team_user", def = "{'team_id': 1, 'user_id': 1}")
)
class WorkLogEntity(
    @Id
    var id: String? = null,

    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "user_id")
    var userId: String,

    @Field(name = "session_id")
    var sessionId: String? = null,

    @Field(name = "parent_id")
    var parentId: String? = null,

    @Field(name = "title")
    var title: String,

    @Field(name = "description")
    var description: String? = null,

    @Field(name = "status")
    var status: WorkLogStatus = WorkLogStatus.TODO,

    @Field(name = "priority")
    var priority: WorkLogPriority = WorkLogPriority.MEDIUM,

    @Field(name = "tags")
    var tags: List<String> = emptyList(),

    @Field(name = "due_date")
    var dueDate: LocalDate? = null,

    @Field(name = "completed_at")
    var completedAt: Instant? = null,

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): WorkLog = WorkLog(
        id = id,
        teamId = teamId,
        userId = userId,
        sessionId = sessionId,
        parentId = parentId,
        title = title,
        description = description,
        status = status,
        priority = priority,
        tags = tags,
        dueDate = dueDate,
        completedAt = completedAt
    ).also {
        it.createdAt = createdAt
        it.updatedAt = updatedAt
    }

    companion object {
        fun from(domain: WorkLog): WorkLogEntity = WorkLogEntity(
            id = domain.id,
            teamId = domain.teamId,
            userId = domain.userId,
            sessionId = domain.sessionId,
            parentId = domain.parentId,
            title = domain.title,
            description = domain.description,
            status = domain.status,
            priority = domain.priority,
            tags = domain.tags,
            dueDate = domain.dueDate,
            completedAt = domain.completedAt
        ).also { entity ->
            entity.createdAt = domain.createdAt
            entity.updatedAt = domain.updatedAt
        }
    }
}
