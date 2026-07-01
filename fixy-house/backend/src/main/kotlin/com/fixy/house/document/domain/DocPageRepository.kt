package com.fixy.house.document.domain

interface DocPageRepository {
    fun findById(pageId: String): DocPage?
    fun findByTeamIdAndId(teamId: String, pageId: String): DocPage?
    fun findAllByTeamIdAndSpaceId(teamId: String, spaceId: String): List<DocPage>
    fun findAllByTeamIdAndSpaceIdAndParentId(teamId: String, spaceId: String, parentId: String?): List<DocPage>
    fun findAllByTeamId(teamId: String): List<DocPage>
    fun save(page: DocPage): DocPage
    fun delete(page: DocPage)
}
