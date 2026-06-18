package com.fixy.house.document.ui

import com.fixy.house.document.application.dto.request.CreateDocPageRequest
import com.fixy.house.document.application.dto.request.CreateSpaceRequest
import com.fixy.house.document.application.dto.request.UpdateDocPageRequest
import com.fixy.house.document.application.dto.request.UpdateSpaceRequest
import com.fixy.house.document.application.dto.response.DocPageDetailResponse
import com.fixy.house.document.application.dto.response.DocPageSummaryResponse
import com.fixy.house.document.application.dto.response.SpaceSummaryResponse
import com.fixy.house.document.application.service.DocumentService
import com.fixy.house.global.security.AuthUser
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Documents", description = "팀 문서 (스페이스 + 페이지)")
@RestController
@RequestMapping("/api/v1")
class DocumentApi(private val documentService: DocumentService) {

    // ────────── Space ──────────

    @Operation(summary = "팀 스페이스 목록")
    @GetMapping("/teams/{teamId}/spaces")
    fun listSpaces(
        @AuthUser userId: String,
        @PathVariable teamId: String
    ): ResponseEntity<List<SpaceSummaryResponse>> =
        ResponseEntity.ok(documentService.listSpaces(userId, teamId))

    @Operation(summary = "스페이스 생성")
    @PostMapping("/teams/{teamId}/spaces")
    fun createSpace(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @Valid @RequestBody request: CreateSpaceRequest
    ): ResponseEntity<SpaceSummaryResponse> =
        ResponseEntity.ok(documentService.createSpace(userId, teamId, request))

    @Operation(summary = "스페이스 수정 (MANAGER+)")
    @PatchMapping("/teams/{teamId}/spaces/{spaceId}")
    fun updateSpace(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable spaceId: String,
        @Valid @RequestBody request: UpdateSpaceRequest
    ): ResponseEntity<SpaceSummaryResponse> =
        ResponseEntity.ok(documentService.updateSpace(userId, teamId, spaceId, request))

    @Operation(summary = "스페이스 삭제 (MANAGER+, 페이지 cascade)")
    @DeleteMapping("/teams/{teamId}/spaces/{spaceId}")
    fun deleteSpace(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable spaceId: String
    ): ResponseEntity<Void> {
        documentService.deleteSpace(userId, teamId, spaceId)
        return ResponseEntity.noContent().build()
    }

    // ────────── Page ──────────

    @Operation(summary = "스페이스 페이지 목록 (parentId 필터)")
    @GetMapping("/teams/{teamId}/spaces/{spaceId}/documents")
    fun listPages(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable spaceId: String,
        @RequestParam(required = false) parentId: String?
    ): ResponseEntity<List<DocPageSummaryResponse>> =
        ResponseEntity.ok(documentService.listPages(userId, teamId, spaceId, parentId))

    @Operation(summary = "페이지 생성")
    @PostMapping("/teams/{teamId}/spaces/{spaceId}/documents")
    fun createPage(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable spaceId: String,
        @Valid @RequestBody request: CreateDocPageRequest
    ): ResponseEntity<DocPageSummaryResponse> =
        ResponseEntity.ok(documentService.createPage(userId, teamId, spaceId, request))

    @Operation(summary = "페이지 상세 조회")
    @GetMapping("/teams/{teamId}/documents/{pageId}")
    fun getPage(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable pageId: String
    ): ResponseEntity<DocPageDetailResponse> =
        ResponseEntity.ok(documentService.getPage(userId, teamId, pageId))

    @Operation(summary = "페이지 수정")
    @PatchMapping("/teams/{teamId}/documents/{pageId}")
    fun updatePage(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable pageId: String,
        @Valid @RequestBody request: UpdateDocPageRequest
    ): ResponseEntity<DocPageDetailResponse> =
        ResponseEntity.ok(documentService.updatePage(userId, teamId, pageId, request))

    @Operation(summary = "페이지 삭제 (MANAGER+, 자식 cascade)")
    @DeleteMapping("/teams/{teamId}/documents/{pageId}")
    fun deletePage(
        @AuthUser userId: String,
        @PathVariable teamId: String,
        @PathVariable pageId: String
    ): ResponseEntity<Void> {
        documentService.deletePage(userId, teamId, pageId)
        return ResponseEntity.noContent().build()
    }
}
