package com.fixy.house.document.application.service

import com.fixy.house.document.application.dto.request.CreateDocPageRequest
import com.fixy.house.document.application.dto.request.CreateSpaceRequest
import com.fixy.house.document.application.dto.request.UpdateSpaceRequest
import com.fixy.house.document.domain.DocPage
import com.fixy.house.document.domain.DocPageRepository
import com.fixy.house.document.domain.Space
import com.fixy.house.document.domain.SpaceRepository
import com.fixy.house.document.domain.exception.DocumentExceptionType
import com.fixy.house.document.domain.policy.TeamRoleResolver
import com.fixy.house.document.domain.vo.DocumentVisibility
import com.fixy.house.document.domain.vo.TeamRole
import com.fixy.house.global.exceptions.CustomException
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify

class DocumentServiceTest : DescribeSpec({

    val spaceRepository: SpaceRepository = mockk(relaxed = true)
    val docPageRepository: DocPageRepository = mockk(relaxed = true)
    val teamRoleResolver: TeamRoleResolver = mockk()
    val service = DocumentService(spaceRepository, docPageRepository, teamRoleResolver)

    fun stubSpace(id: String = "sp-1", teamId: String = "team-1", slug: String = "slug-1"): Space {
        val space = Space.create(
            teamId = teamId,
            name = "Space",
            slug = slug,
            description = null,
            icon = null,
            orderIndex = 0,
            createdByUserId = "creator"
        )
        space.id = id
        return space
    }

    fun stubPage(
        id: String = "pg-1",
        teamId: String = "team-1",
        spaceId: String = "sp-1",
        parentId: String? = null,
        authorUserId: String = "user-1"
    ): DocPage {
        val page = DocPage.create(
            teamId = teamId,
            spaceId = spaceId,
            parentId = parentId,
            title = "title",
            content = "body",
            orderIndex = 0,
            visibility = DocumentVisibility.TEAM,
            authorUserId = authorUserId,
            tags = emptyList()
        )
        page.id = id
        return page
    }

    beforeEach {
        clearMocks(spaceRepository, docPageRepository, teamRoleResolver)
    }

    describe("Space - createSpace") {
        it("MEMBER+ 가 slug 미지정으로 생성하면 name 으로부터 자동 생성") {
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns TeamRole.MEMBER
            every { spaceRepository.existsByTeamIdAndSlug("team-1", "engine-room") } returns false
            every { spaceRepository.save(any()) } answers { firstArg() }

            val response = service.createSpace(
                actorUserId = "actor",
                teamId = "team-1",
                request = CreateSpaceRequest(name = "Engine Room", slug = null)
            )
            response.slug shouldBe "engine-room"
        }

        it("중복 slug 면 SPACE_SLUG_ALREADY_IN_USE") {
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns TeamRole.MEMBER
            every { spaceRepository.existsByTeamIdAndSlug("team-1", "engine-room") } returns true
            val ex = shouldThrow<CustomException> {
                service.createSpace("actor", "team-1", CreateSpaceRequest(name = "x", slug = "engine-room"))
            }
            ex.getExceptionType() shouldBe DocumentExceptionType.SPACE_SLUG_ALREADY_IN_USE
        }
    }

    describe("Space - updateSpace") {
        it("MANAGER+ 만 수정 가능") {
            val space = stubSpace()
            every { spaceRepository.findByTeamIdAndId("team-1", "sp-1") } returns space
            every { teamRoleResolver.resolveRole("member", "team-1") } returns TeamRole.MEMBER
            val ex = shouldThrow<CustomException> {
                service.updateSpace("member", "team-1", "sp-1", UpdateSpaceRequest(name = "x"))
            }
            ex.getExceptionType() shouldBe DocumentExceptionType.PAGE_FORBIDDEN
        }

        it("MANAGER 가 수정") {
            val space = stubSpace()
            every { spaceRepository.findByTeamIdAndId("team-1", "sp-1") } returns space
            every { teamRoleResolver.resolveRole("mgr", "team-1") } returns TeamRole.MANAGER
            every { spaceRepository.save(any()) } answers { firstArg() }
            val response = service.updateSpace("mgr", "team-1", "sp-1", UpdateSpaceRequest(name = "New"))
            response.name shouldBe "New"
        }
    }

    describe("Space - deleteSpace cascade") {
        it("MANAGER 가 삭제하면 그 안의 페이지도 cascade") {
            val space = stubSpace()
            val page = stubPage(id = "p1")
            every { spaceRepository.findByTeamIdAndId("team-1", "sp-1") } returns space
            every { docPageRepository.findAllByTeamIdAndSpaceId("team-1", "sp-1") } returns listOf(page)
            every { teamRoleResolver.resolveRole("mgr", "team-1") } returns TeamRole.MANAGER

            service.deleteSpace("mgr", "team-1", "sp-1")
            verify { docPageRepository.delete(page) }
            verify { spaceRepository.delete(space) }
        }
    }

    describe("Page - createPage") {
        it("MEMBER 가 생성") {
            val space = stubSpace()
            every { spaceRepository.findByTeamIdAndId("team-1", "sp-1") } returns space
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns TeamRole.MEMBER
            every { docPageRepository.save(any()) } answers { firstArg() }

            val response = service.createPage(
                actorUserId = "actor",
                teamId = "team-1",
                spaceId = "sp-1",
                request = CreateDocPageRequest(title = "Hello", content = "world")
            )
            response.title shouldBe "Hello"
            response.authorUserId shouldBe "actor"
        }

        it("parentId 가 다른 스페이스면 PARENT_PAGE_MISMATCH") {
            val space = stubSpace()
            val otherSpaceParent = stubPage(id = "p1", teamId = "team-1", spaceId = "sp-other")
            every { spaceRepository.findByTeamIdAndId("team-1", "sp-1") } returns space
            every { teamRoleResolver.resolveRole("actor", "team-1") } returns TeamRole.MEMBER
            every { docPageRepository.findById("p1") } returns otherSpaceParent
            val ex = shouldThrow<CustomException> {
                service.createPage(
                    "actor", "team-1", "sp-1",
                    CreateDocPageRequest(title = "x", parentId = "p1")
                )
            }
            ex.getExceptionType() shouldBe DocumentExceptionType.PARENT_PAGE_MISMATCH
        }
    }

    describe("Page - deletePage cascade") {
        it("MANAGER 가 삭제하면 자식 페이지도 함께 삭제") {
            val parent = stubPage(id = "p1", parentId = null)
            val child = stubPage(id = "c1", parentId = "p1")
            every { docPageRepository.findByTeamIdAndId("team-1", "p1") } returns parent
            every { docPageRepository.findAllByTeamIdAndSpaceIdAndParentId("team-1", "sp-1", "p1") } returns listOf(child)
            every { docPageRepository.findAllByTeamIdAndSpaceIdAndParentId("team-1", "sp-1", "c1") } returns emptyList()
            every { teamRoleResolver.resolveRole("mgr", "team-1") } returns TeamRole.MANAGER

            service.deletePage("mgr", "team-1", "p1")
            verify { docPageRepository.delete(child) }
            verify { docPageRepository.delete(parent) }
        }
    }

    describe("resolveSlug") {
        it("소문자/숫자/하이픈 외 문자 제거 + 공백 → -") {
            service.resolveSlug("Engine Room #2!") shouldBe "engine-room-2"
        }
    }
})
