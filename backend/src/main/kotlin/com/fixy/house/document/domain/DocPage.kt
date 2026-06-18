package com.fixy.house.document.domain

import com.fixy.house.global.BaseEntity
import com.fixy.house.document.domain.vo.DocumentVisibility

class DocPage(
    var id: String? = null,
    var teamId: String,
    var spaceId: String,
    var parentId: String? = null,
    var title: String,
    var content: String = "",
    var orderIndex: Int = 0,
    var visibility: DocumentVisibility = DocumentVisibility.TEAM,
    var authorUserId: String,
    var lastEditorUserId: String,
    var tags: List<String> = emptyList()
) : BaseEntity() {

    init {
        require(teamId.isNotBlank()) { "teamId 는 비어 있을 수 없습니다." }
        require(spaceId.isNotBlank()) { "spaceId 는 비어 있을 수 없습니다." }
        require(authorUserId.isNotBlank()) { "authorUserId 는 비어 있을 수 없습니다." }
        require(lastEditorUserId.isNotBlank()) { "lastEditorUserId 는 비어 있을 수 없습니다." }
        require(title.isNotBlank()) { "title 은 비어 있을 수 없습니다." }
        require(title.length <= MAX_TITLE_LENGTH) { "title 은 $MAX_TITLE_LENGTH 자 이하여야 합니다." }
        require(orderIndex >= 0) { "orderIndex 는 0 이상이어야 합니다." }
    }

    fun edit(
        newTitle: String?,
        newContent: String?,
        newVisibility: DocumentVisibility?,
        newTags: List<String>?,
        newOrderIndex: Int?,
        editorUserId: String
    ) {
        newTitle?.let {
            require(it.isNotBlank()) { "title 은 비어 있을 수 없습니다." }
            require(it.length <= MAX_TITLE_LENGTH) { "title 은 $MAX_TITLE_LENGTH 자 이하여야 합니다." }
            this.title = it
        }
        if (newContent != null) this.content = newContent
        if (newVisibility != null) this.visibility = newVisibility
        if (newTags != null) this.tags = newTags
        if (newOrderIndex != null) {
            require(newOrderIndex >= 0) { "orderIndex 는 0 이상이어야 합니다." }
            this.orderIndex = newOrderIndex
        }
        this.lastEditorUserId = editorUserId
    }

    fun moveTo(newParentId: String?) {
        this.parentId = newParentId
    }

    companion object {
        const val MAX_TITLE_LENGTH = 200

        fun create(
            teamId: String,
            spaceId: String,
            parentId: String?,
            title: String,
            content: String,
            orderIndex: Int,
            visibility: DocumentVisibility,
            authorUserId: String,
            tags: List<String>
        ): DocPage = DocPage(
            teamId = teamId,
            spaceId = spaceId,
            parentId = parentId,
            title = title,
            content = content,
            orderIndex = orderIndex,
            visibility = visibility,
            authorUserId = authorUserId,
            lastEditorUserId = authorUserId,
            tags = tags
        )
    }
}
