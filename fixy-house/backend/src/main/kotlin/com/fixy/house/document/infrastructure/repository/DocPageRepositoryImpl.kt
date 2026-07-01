package com.fixy.house.document.infrastructure.repository

import com.fixy.house.document.domain.DocPage
import com.fixy.house.document.domain.DocPageRepository
import com.fixy.house.document.infrastructure.entity.DocPageEntity
import org.springframework.stereotype.Repository

@Repository
class DocPageRepositoryImpl(
    private val docPageMongoRepository: DocPageMongoRepository
) : DocPageRepository {

    override fun findById(pageId: String): DocPage? =
        docPageMongoRepository.findById(pageId).orElse(null)?.toDomain()

    override fun findByTeamIdAndId(teamId: String, pageId: String): DocPage? =
        docPageMongoRepository.findByTeamIdAndId(teamId, pageId)?.toDomain()

    override fun findAllByTeamIdAndSpaceId(teamId: String, spaceId: String): List<DocPage> =
        docPageMongoRepository.findAllByTeamIdAndSpaceId(teamId, spaceId).map { it.toDomain() }

    override fun findAllByTeamIdAndSpaceIdAndParentId(
        teamId: String,
        spaceId: String,
        parentId: String?
    ): List<DocPage> =
        docPageMongoRepository.findAllByTeamIdAndSpaceIdAndParentId(teamId, spaceId, parentId).map { it.toDomain() }

    override fun findAllByTeamId(teamId: String): List<DocPage> =
        docPageMongoRepository.findAllByTeamId(teamId).map { it.toDomain() }

    override fun save(page: DocPage): DocPage =
        docPageMongoRepository.save(DocPageEntity.from(page)).toDomain()

    override fun delete(page: DocPage) {
        page.id?.let { docPageMongoRepository.deleteById(it) }
    }
}
