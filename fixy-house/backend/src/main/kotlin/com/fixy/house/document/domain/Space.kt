package com.fixy.house.document.domain

import com.fixy.house.global.BaseEntity

class Space(
    var id: String? = null,
    var teamId: String,
    var name: String,
    var slug: String,
    var description: String? = null,
    var icon: String? = null,
    var orderIndex: Int = 0,
    var createdByUserId: String
) : BaseEntity() {

    init {
        require(teamId.isNotBlank()) { "teamId 는 비어 있을 수 없습니다." }
        require(createdByUserId.isNotBlank()) { "createdByUserId 는 비어 있을 수 없습니다." }
        require(name.isNotBlank()) { "name 은 비어 있을 수 없습니다." }
        require(name.length <= MAX_NAME_LENGTH) { "name 은 $MAX_NAME_LENGTH 자 이하여야 합니다." }
        require(SLUG_REGEX.matches(slug)) { "slug 는 $SLUG_REGEX 패턴을 따라야 합니다." }
    }

    fun rename(newName: String) {
        require(newName.isNotBlank()) { "name 은 비어 있을 수 없습니다." }
        require(newName.length <= MAX_NAME_LENGTH) { "name 은 $MAX_NAME_LENGTH 자 이하여야 합니다." }
        this.name = newName
    }

    fun updateDescription(newDescription: String?) {
        this.description = newDescription
    }

    fun updateIcon(newIcon: String?) {
        this.icon = newIcon
    }

    fun changeOrder(newOrder: Int) {
        require(newOrder >= 0) { "orderIndex 는 0 이상이어야 합니다." }
        this.orderIndex = newOrder
    }

    companion object {
        const val MAX_NAME_LENGTH = 50
        private val SLUG_REGEX = Regex("^[a-z0-9-]{2,40}$")

        fun create(
            teamId: String,
            name: String,
            slug: String,
            description: String?,
            icon: String?,
            orderIndex: Int,
            createdByUserId: String
        ): Space = Space(
            teamId = teamId,
            name = name,
            slug = slug,
            description = description,
            icon = icon,
            orderIndex = orderIndex,
            createdByUserId = createdByUserId
        )
    }
}
