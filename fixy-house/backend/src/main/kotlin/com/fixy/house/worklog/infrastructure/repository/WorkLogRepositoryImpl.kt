package com.fixy.house.worklog.infrastructure.repository

import com.fixy.house.worklog.domain.WorkLog
import com.fixy.house.worklog.domain.WorkLogRepository
import com.fixy.house.worklog.domain.vo.WorkLogPriority
import com.fixy.house.worklog.domain.vo.WorkLogStatus
import com.fixy.house.worklog.infrastructure.entity.WorkLogEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.query.Criteria
import org.springframework.data.mongodb.core.query.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
class WorkLogRepositoryImpl(
    private val workLogMongoRepository: WorkLogMongoRepository,
    private val mongoTemplate: MongoTemplate
) : WorkLogRepository {

    override fun findById(workLogId: String): WorkLog? =
        workLogMongoRepository.findById(workLogId).orElse(null)?.toDomain()

    override fun findByTeamIdAndId(teamId: String, workLogId: String): WorkLog? =
        workLogMongoRepository.findByTeamIdAndId(teamId, workLogId)?.toDomain()

    override fun findAllByTeamId(teamId: String): List<WorkLog> =
        workLogMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun findAllByTeamIdAndUserId(teamId: String, userId: String): List<WorkLog> =
        workLogMongoRepository.findAllByTeamIdAndUserId(teamId, userId).map { it.toDomain() }

    override fun findAllBySessionId(sessionId: String): List<WorkLog> =
        workLogMongoRepository.findAllBySessionId(sessionId).map { it.toDomain() }

    override fun findPageByTeamId(
        teamId: String,
        statuses: List<WorkLogStatus>?,
        priorities: List<WorkLogPriority>?,
        assigneeUserId: String?,
        search: String?,
        dueBefore: LocalDate?,
        pageable: Pageable
    ): Page<WorkLog> {
        val criteria = buildFilterCriteria(
            teamId = teamId,
            statuses = statuses,
            priorities = priorities,
            assigneeUserId = assigneeUserId,
            search = search,
            dueBefore = dueBefore
        )
        val sort = pageable.sort.takeIf { it.isSorted } ?: Sort.by(Sort.Direction.DESC, "created_at")
        val pageableWithSort = if (pageable.sort.isUnsorted) {
            org.springframework.data.domain.PageRequest.of(pageable.pageNumber, pageable.pageSize, sort)
        } else {
            pageable
        }
        val query = Query(criteria).with(pageableWithSort)
        val countQuery = Query(criteria)

        val total = mongoTemplate.count(countQuery, WorkLogEntity::class.java)
        val entities = if (total == 0L) {
            emptyList()
        } else {
            mongoTemplate.find(query, WorkLogEntity::class.java)
        }
        return PageImpl(entities.map { it.toDomain() }, pageableWithSort, total)
    }

    override fun save(workLog: WorkLog): WorkLog =
        workLogMongoRepository.save(WorkLogEntity.from(workLog)).toDomain()

    override fun delete(workLog: WorkLog) {
        workLog.id?.let { workLogMongoRepository.deleteById(it) }
    }

    private fun buildFilterCriteria(
        teamId: String,
        statuses: List<WorkLogStatus>?,
        priorities: List<WorkLogPriority>?,
        assigneeUserId: String?,
        search: String?,
        dueBefore: LocalDate?
    ): Criteria {
        val criteria = Criteria.where("team_id").`is`(teamId)
        statuses?.takeIf { it.isNotEmpty() }?.let { criteria.and("status").`in`(it) }
        priorities?.takeIf { it.isNotEmpty() }?.let { criteria.and("priority").`in`(it) }
        assigneeUserId?.let { criteria.and("user_id").`is`(it) }
        dueBefore?.let { criteria.and("due_date").lte(it) }
        search?.takeIf { it.isNotBlank() }?.let { needle ->
            val regex = Regex.escape(needle)
            criteria.orOperator(
                Criteria.where("title").regex(regex, "i"),
                Criteria.where("description").regex(regex, "i")
            )
        }
        return criteria
    }
}
