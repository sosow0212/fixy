"""Ingestion 도메인 Document — 데이터소스 / 인제스트 잡.

매핑/스키마 추론의 sub-document Pydantic 모델도 함께 둔다 (관계 무결성은 service 에서).
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field


# ── 스키마 추론 결과 (sub-document) ─────────────────────────────────────────────
class InferredColumn(BaseModel):
    column: str
    inferredType: str  # string | integer | double | boolean | date


# ── 매핑 정의 (sub-document) ──────────────────────────────────────────────────
class MappingPrimaryKey(BaseModel):
    column: str
    property: str


class MappingProperty(BaseModel):
    column: str
    property: str
    transform: Optional[str] = None  # to_date | to_int | to_bool | to_string


class MappingLinkTarget(BaseModel):
    objectTypeApiName: str
    matchColumn: str
    matchProperty: str


class MappingLink(BaseModel):
    linkTypeApiName: str
    direction: str = "OUT"  # OUT | IN
    target: MappingLinkTarget


class ObjectMapping(BaseModel):
    objectTypeApiName: str
    primaryKey: MappingPrimaryKey
    properties: list[MappingProperty] = Field(default_factory=list)
    links: list[MappingLink] = Field(default_factory=list)


# ── DataSource 문서 ────────────────────────────────────────────────────────────
class DataSource(Document):
    name: Indexed(str)
    kind: str  # csv | json
    storagePath: str
    schema: list[InferredColumn] = Field(default_factory=list)
    mappings: list[ObjectMapping] = Field(default_factory=list)
    stubOnMissingTarget: bool = False  # 링크 대상 노드 없을 때 스텁 생성 여부 (Phase 2 설정)
    uploadedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "data_sources"


# ── Ingest Job 상태 추적 ───────────────────────────────────────────────────────
class IngestStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class IngestJob(Document):
    dataSourceId: Indexed(str)
    status: IngestStatus = IngestStatus.PENDING
    createdNodes: int = 0
    updatedNodes: int = 0
    createdLinks: int = 0
    skippedRows: int = 0
    errorRows: list[dict[str, Any]] = Field(default_factory=list)
    startedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    finishedAt: Optional[datetime] = None
    errorMessage: Optional[str] = None

    class Settings:
        name = "ingest_jobs"
