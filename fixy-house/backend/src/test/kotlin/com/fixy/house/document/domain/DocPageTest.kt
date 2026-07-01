package com.fixy.house.document.domain

import com.fixy.house.document.domain.vo.DocumentVisibility
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe

class SpaceTest : DescribeSpec({

    describe("Space.create") {
        it("유효한 필드로 Space 를 생성한다") {
            val space = Space.create(
                teamId = "team-1",
                name = "엔진 룸",
                slug = "engine-room",
                description = "핵심 문서",
                icon = "🚗",
                orderIndex = 0,
                createdByUserId = "user-1"
            )
            space.name shouldBe "엔진 룸"
            space.slug shouldBe "engine-room"
            space.icon shouldBe "🚗"
            space.orderIndex shouldBe 0
        }

        it("빈 name 은 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                Space.create("t", " ", "valid-slug", null, null, 0, "u")
            }
        }

        it("name 이 50자 초과면 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                Space.create("t", "a".repeat(51), "valid-slug", null, null, 0, "u")
            }
        }

        it("잘못된 slug 는 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                Space.create("t", "name", "Bad_Slug!", null, null, 0, "u")
            }
        }
    }

    describe("Space.rename") {
        it("정상 변경") {
            val space = Space.create("t", "old", "valid-slug", null, null, 0, "u")
            space.rename("new")
            space.name shouldBe "new"
        }

        it("빈 이름으로의 변경은 IllegalArgumentException") {
            val space = Space.create("t", "old", "valid-slug", null, null, 0, "u")
            shouldThrow<IllegalArgumentException> { space.rename(" ") }
        }
    }

    describe("Space.changeOrder") {
        it("0 이상만 허용") {
            val space = Space.create("t", "name", "valid-slug", null, null, 0, "u")
            space.changeOrder(5)
            space.orderIndex shouldBe 5
            shouldThrow<IllegalArgumentException> { space.changeOrder(-1) }
        }
    }
})

class DocPageTest : DescribeSpec({

    fun newPage(): DocPage = DocPage.create(
        teamId = "t",
        spaceId = "s",
        parentId = null,
        title = "title",
        content = "body",
        orderIndex = 0,
        visibility = DocumentVisibility.TEAM,
        authorUserId = "user-1",
        tags = emptyList()
    )

    describe("DocPage.create") {
        it("정상 생성") {
            val page = newPage()
            page.authorUserId shouldBe "user-1"
            page.lastEditorUserId shouldBe "user-1"
            page.visibility shouldBe DocumentVisibility.TEAM
        }

        it("빈 title 은 IllegalArgumentException") {
            shouldThrow<IllegalArgumentException> {
                DocPage.create("t", "s", null, " ", "body", 0, DocumentVisibility.TEAM, "u", emptyList())
            }
        }
    }

    describe("DocPage.edit") {
        it("lastEditorUserId 가 갱신된다") {
            val page = newPage()
            page.edit(null, "new content", null, null, null, "user-2")
            page.content shouldBe "new content"
            page.lastEditorUserId shouldBe "user-2"
        }

        it("title 변경") {
            val page = newPage()
            page.edit("new title", null, null, null, null, "user-2")
            page.title shouldBe "new title"
        }

        it("tags 변경") {
            val page = newPage()
            page.edit(null, null, null, listOf("a", "b"), null, "user-2")
            page.tags shouldBe listOf("a", "b")
        }

        it("orderIndex 변경") {
            val page = newPage()
            page.edit(null, null, null, null, 7, "user-2")
            page.orderIndex shouldBe 7
        }

        it("음수 orderIndex 는 IllegalArgumentException") {
            val page = newPage()
            shouldThrow<IllegalArgumentException> {
                page.edit(null, null, null, null, -1, "user-2")
            }
        }
    }

    describe("DocPage.moveTo") {
        it("parentId 만 변경된다") {
            val page = newPage()
            page.moveTo("new-parent")
            page.parentId shouldBe "new-parent"
            page.title shouldBe "title"
        }
    }
})
