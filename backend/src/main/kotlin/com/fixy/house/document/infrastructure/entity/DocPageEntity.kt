package com.fixy.house.document.infrastructure.entity

import com.fixy.house.document.domain.DocPage
import com.fixy.house.document.domain.vo.DocumentVisibility
import com.fixy.house.global.MongoAuditableEntity
import org.springframework.data.annotation.Id
import org.springframework.data.annotation.Version
import org.springframework.data.mongodb.core.index.CompoundIndex
import org.springframework.data.mongodb.core.index.CompoundIndexes
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.core.mapping.Field

@Document(collection = "doc_pages")
@CompoundIndexes(
    CompoundIndex(name = "team_space_parent", def = "{'team_id': 1, 'space_id': 1, 'parent_id': 1}"),
    CompoundIndex(name = "team_space", def = "{'team_id': 1, 'space_id': 1}")
)
class DocPageEntity(
    @Id
    var id: String? = null,

    @Field(name = "team_id")
    var teamId: String,

    @Field(name = "space_id")
    var spaceId: String,

    @Field(name = "parent_id")
    var parentId: String? = null,

    @Field(name = "title")
    var title: String,

    @Field(name = "content")
    var content: String = "",

    @Field(name = "order_index")
    var orderIndex: Int = 0,

    @Field(name = "visibility")
    var visibility: DocumentVisibility = DocumentVisibility.TEAM,

    @Field(name = "author_user_id")
    var authorUserId: String,

    @Field(name = "last_editor_user_id")
    var lastEditorUserId: String,

    @Field(name = "tags")
    var tags: List<String> = emptyList(),

    @Version
    @Field(name = "version")
    var version: Long? = null
) : MongoAuditableEntity() {

    fun toDomain(): DocPage = DocPage(
        id = id,
        teamId = teamId,
        spaceId = spaceId,
        parentId = parentId,
        title = title,
        content = content,
        orderIndex = orderIndex,
        visibility = visibility,
        authorUserId = authorUserId,
        lastEditorUserId = lastEditorUserId,
        tags = tags
    ).also {
        it.createdAt = createdAt
        it.updatedAt = updatedAt
    }

    companion object {
        fun from(domain: DocPage): DocPageEntity = DocPageEntity(
            id = domain.id,
            teamId = domain.teamId,
            spaceId = domain.spaceId,
            parentId = domain.parentId,
            title = domain.title,
            content = domain.content,
            orderIndex = domain.orderIndex,
            visibility = domain.visibility,
            authorUserId = domain.authorUserId,
            lastEditorUserId = domain.lastEditorUserId,
            tags = domain.tags
        ).also { entity ->
            entity.createdAt = domain.createdAt
            entity.updatedAt = domain.updatedAt
        }
    }
}
