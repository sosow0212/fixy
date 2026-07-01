package com.fixy.house.worklog.domain

import com.fixy.house.global.BaseEntity
import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import java.time.Instant
import java.time.LocalDate

class WorkLog(
    var id: String? = null,
    var teamId: String,
    var userId: String,
    var sessionId: String? = null,
    var parentId: String? = null,
    var title: String,
    var description: String? = null,
    var status: WorkLogStatus = WorkLogStatus.TODO,
    var priority: WorkLogPriority = WorkLogPriority.MEDIUM,
    var tags: List<String> = emptyList(),
    var dueDate: LocalDate? = null,
    var completedAt: Instant? = null
) : BaseEntity() {

    init {
        require(teamId.isNotBlank()) { "teamId 는 비어 있을 수 없습니다." }
        require(userId.isNotBlank()) { "userId 는 비어 있을 수 없습니다." }
        require(title.isNotBlank()) { "title 은 비어 있을 수 없습니다." }
        require(title.length <= MAX_TITLE_LENGTH) { "title 은 $MAX_TITLE_LENGTH 자 이하여야 합니다." }
    }

    fun update(
        newTitle: String?,
        newDescription: String?,
        newStatus: WorkLogStatus?,
        newPriority: WorkLogPriority?,
        newTags: List<String>?,
        newDueDate: LocalDate?
    ) {
        newTitle?.let {
            require(it.isNotBlank()) { "title 은 비어 있을 수 없습니다." }
            require(it.length <= MAX_TITLE_LENGTH) { "title 은 $MAX_TITLE_LENGTH 자 이하여야 합니다." }
            this.title = it
        }
        if (newDescription != null) this.description = newDescription
        if (newPriority != null) this.priority = newPriority
        if (newTags != null) this.tags = newTags
        if (newDueDate != null) this.dueDate = newDueDate
        if (newStatus != null) changeStatus(newStatus)
    }

    private fun changeStatus(newStatus: WorkLogStatus) {
        if (this.status == newStatus) return
        if (newStatus == WorkLogStatus.DONE) {
            this.completedAt = Instant.now()
        } else if (this.status == WorkLogStatus.DONE) {
            this.completedAt = null
        }
        this.status = newStatus
    }

    companion object {
        const val MAX_TITLE_LENGTH = 200

        fun create(
            teamId: String,
            userId: String,
            title: String,
            description: String?,
            priority: WorkLogPriority,
            tags: List<String>,
            dueDate: LocalDate?,
            parentId: String?,
            sessionId: String?
        ): WorkLog = WorkLog(
            teamId = teamId,
            userId = userId,
            sessionId = sessionId,
            parentId = parentId,
            title = title,
            description = description,
            priority = priority,
            tags = tags,
            dueDate = dueDate
        )
    }
}
