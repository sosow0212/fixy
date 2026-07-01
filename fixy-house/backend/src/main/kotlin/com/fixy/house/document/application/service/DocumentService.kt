package com.fixy.house.document.application.service

import com.fixy.house.document.application.dto.request.CreateDocPageRequest
import com.fixy.house.document.application.dto.request.CreateSpaceRequest
import com.fixy.house.document.application.dto.request.UpdateDocPageRequest
import com.fixy.house.document.application.dto.request.UpdateSpaceRequest
import com.fixy.house.document.application.dto.response.DocPageDetailResponse
import com.fixy.house.document.application.dto.response.DocPageSummaryResponse
import com.fixy.house.document.application.dto.response.SpaceSummaryResponse
import com.fixy.house.document.domain.DocPage
import com.fixy.house.document.domain.DocPageRepository
import com.fixy.house.document.domain.Space
import com.fixy.house.document.domain.SpaceRepository
import com.fixy.house.document.domain.exception.DocumentExceptionType
import com.fixy.house.document.domain.policy.TeamRoleResolver
import com.fixy.house.document.domain.vo.DocumentVisibility
import com.fixy.house.document.domain.vo.TeamRole
import com.fixy.house.global.exceptions.CustomException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DocumentService(
    private val spaceRepository: SpaceRepository,
    private val docPageRepository: DocPageRepository,
    private val teamRoleResolver: TeamRoleResolver
) {

    // ────────── Space ──────────

    @Transactional
    fun createSpace(actorUserId: String, teamId: String, request: CreateSpaceRequest): SpaceSummaryResponse {
        requireMember(actorUserId, teamId)
        val slug = request.slug?.takeIf { it.isNotBlank() } ?: resolveSlug(request.name)
        if (spaceRepository.existsByTeamIdAndSlug(teamId, slug)) {
            throw CustomException(DocumentExceptionType.SPACE_SLUG_ALREADY_IN_USE)
        }
        val space = Space.create(
            teamId = teamId,
            name = request.name,
            slug = slug,
            description = request.description,
            icon = request.icon,
            orderIndex = request.orderIndex,
            createdByUserId = actorUserId
        )
        return SpaceSummaryResponse.from(spaceRepository.save(space))
    }

    @Transactional(readOnly = true)
    fun listSpaces(actorUserId: String, teamId: String): List<SpaceSummaryResponse> {
        requireMember(actorUserId, teamId)
        return spaceRepository.findAllByTeamId(teamId).map { SpaceSummaryResponse.from(it) }
    }

    @Transactional
    fun updateSpace(
        actorUserId: String,
        teamId: String,
        spaceId: String,
        request: UpdateSpaceRequest
    ): SpaceSummaryResponse {
        requireManager(actorUserId, teamId)
        val space = findSpaceByTeamAndId(teamId, spaceId)
        request.name?.let { space.rename(it) }
        if (request.description != null) space.updateDescription(request.description)
        if (request.icon != null) space.updateIcon(request.icon)
        request.orderIndex?.let { space.changeOrder(it) }
        return SpaceSummaryResponse.from(spaceRepository.save(space))
    }

    @Transactional
    fun deleteSpace(actorUserId: String, teamId: String, spaceId: String) {
        requireManager(actorUserId, teamId)
        val space = findSpaceByTeamAndId(teamId, spaceId)
        docPageRepository.findAllByTeamIdAndSpaceId(teamId, spaceId).forEach { docPageRepository.delete(it) }
        spaceRepository.delete(space)
    }

    @Transactional(readOnly = true)
    fun findSpaceByTeamAndId(teamId: String, spaceId: String): Space =
        spaceRepository.findByTeamIdAndId(teamId, spaceId)
            ?: throw CustomException(DocumentExceptionType.SPACE_NOT_FOUND)

    // ────────── Page ──────────

    @Transactional
    fun createPage(
        actorUserId: String,
        teamId: String,
        spaceId: String,
        request: CreateDocPageRequest
    ): DocPageSummaryResponse {
        requireMember(actorUserId, teamId)
        findSpaceByTeamAndId(teamId, spaceId)
        request.parentId?.let { parentId ->
            val parent = docPageRepository.findById(parentId)
                ?: throw CustomException(DocumentExceptionType.PAGE_NOT_FOUND)
            if (parent.teamId != teamId || parent.spaceId != spaceId) {
                throw CustomException(DocumentExceptionType.PARENT_PAGE_MISMATCH)
            }
        }
        val page = DocPage.create(
            teamId = teamId,
            spaceId = spaceId,
            parentId = request.parentId,
            title = request.title,
            content = request.content.orEmpty(),
            orderIndex = request.orderIndex,
            visibility = request.visibility ?: DocumentVisibility.TEAM,
            authorUserId = actorUserId,
            tags = request.tags
        )
        return DocPageSummaryResponse.from(docPageRepository.save(page))
    }

    @Transactional(readOnly = true)
    fun listPages(
        actorUserId: String,
        teamId: String,
        spaceId: String,
        parentId: String?
    ): List<DocPageSummaryResponse> {
        requireMember(actorUserId, teamId)
        findSpaceByTeamAndId(teamId, spaceId)
        val pages = docPageRepository.findAllByTeamIdAndSpaceIdAndParentId(teamId, spaceId, parentId)
        return pages.map { DocPageSummaryResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getPage(actorUserId: String, teamId: String, pageId: String): DocPageDetailResponse {
        requireMember(actorUserId, teamId)
        val page = findPageByTeamAndId(teamId, pageId)
        return DocPageDetailResponse.from(page)
    }

    @Transactional
    fun updatePage(
        actorUserId: String,
        teamId: String,
        pageId: String,
        request: UpdateDocPageRequest
    ): DocPageDetailResponse {
        requireMember(actorUserId, teamId)
        val page = findPageByTeamAndId(teamId, pageId)
        if (request.parentId != null && request.parentId != page.parentId) {
            val parent = docPageRepository.findById(request.parentId)
                ?: throw CustomException(DocumentExceptionType.PAGE_NOT_FOUND)
            if (parent.teamId != teamId || parent.spaceId != page.spaceId) {
                throw CustomException(DocumentExceptionType.PARENT_PAGE_MISMATCH)
            }
        }
        page.edit(
            newTitle = request.title,
            newContent = request.content,
            newVisibility = request.visibility,
            newTags = request.tags,
            newOrderIndex = request.orderIndex,
            editorUserId = actorUserId
        )
        if (request.parentId != null) page.moveTo(request.parentId)
        return DocPageDetailResponse.from(docPageRepository.save(page))
    }

    @Transactional
    fun deletePage(actorUserId: String, teamId: String, pageId: String) {
        requireManager(actorUserId, teamId)
        val page = findPageByTeamAndId(teamId, pageId)
        cascadeDelete(page)
    }

    @Transactional(readOnly = true)
    fun findPageByTeamAndId(teamId: String, pageId: String): DocPage =
        docPageRepository.findByTeamIdAndId(teamId, pageId)
            ?: throw CustomException(DocumentExceptionType.PAGE_NOT_FOUND)

    // ────────── helpers ──────────

    private fun cascadeDelete(page: DocPage) {
        val children = docPageRepository.findAllByTeamIdAndSpaceIdAndParentId(
            page.teamId, page.spaceId, page.id
        )
        children.forEach { cascadeDelete(it) }
        docPageRepository.delete(page)
    }

    private fun requireMember(actorUserId: String, teamId: String) {
        val role = teamRoleResolver.resolveRole(actorUserId, teamId)
            ?: throw CustomException(DocumentExceptionType.PAGE_FORBIDDEN)
        if (role != TeamRole.OWNER && role != TeamRole.MANAGER && role != TeamRole.MEMBER) {
            throw CustomException(DocumentExceptionType.PAGE_FORBIDDEN)
        }
    }

    private fun requireManager(actorUserId: String, teamId: String) {
        val role = teamRoleResolver.resolveRole(actorUserId, teamId)
            ?: throw CustomException(DocumentExceptionType.PAGE_FORBIDDEN)
        if (!role.isAtLeastManager()) {
            throw CustomException(DocumentExceptionType.PAGE_FORBIDDEN)
        }
    }

    fun resolveSlug(input: String): String {
        val normalized = input
            .lowercase()
            .replace(Regex("[^a-z0-9\\s-]"), "")
            .replace(Regex("\\s+"), "-")
            .replace(Regex("-+"), "-")
            .trim('-')
        require(normalized.length in 2..40) { "name 으로부터 유효한 slug 를 만들 수 없습니다." }
        return normalized
    }
}
