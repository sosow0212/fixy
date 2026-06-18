package com.fixy.house.team.domain

import com.fixy.house.global.BaseEntity

class Team(
    var id: String? = null,
    var name: String,
    var slug: String,
    var ownerUserId: String,
    var description: String? = null
) : BaseEntity() {

    init {
        require(name.isNotBlank()) { "팀 이름은 비어 있을 수 없습니다." }
        require(name.length <= MAX_NAME_LENGTH) { "팀 이름은 ${MAX_NAME_LENGTH}자 이하여야 합니다." }
        require(SLUG_REGEX.matches(slug)) { "팀 슬러그는 소문자/숫자/하이픈 ${MIN_SLUG_LENGTH}~${MAX_SLUG_LENGTH}자 여야 합니다." }
        require(ownerUserId.isNotBlank()) { "소유자 사용자 ID는 비어 있을 수 없습니다." }
    }

    fun rename(newName: String) {
        require(newName.isNotBlank()) { "팀 이름은 비어 있을 수 없습니다." }
        require(newName.length <= MAX_NAME_LENGTH) { "팀 이름은 ${MAX_NAME_LENGTH}자 이하여야 합니다." }
        this.name = newName
    }

    fun updateDescription(newDescription: String?) {
        this.description = newDescription?.takeIf { it.isNotBlank() }
    }

    fun transferOwnership(newOwnerUserId: String) {
        require(newOwnerUserId.isNotBlank()) { "새 소유자 사용자 ID는 비어 있을 수 없습니다." }
        this.ownerUserId = newOwnerUserId
    }

    companion object {
        private const val MAX_NAME_LENGTH = 50
        private const val MIN_SLUG_LENGTH = 2
        private const val MAX_SLUG_LENGTH = 40
        private val SLUG_REGEX = Regex("^[a-z0-9-]{$MIN_SLUG_LENGTH,$MAX_SLUG_LENGTH}$")
    }
}
