"""Ingestion Pydantic 스키마 (요청/응답)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.ingestion.models import (
    IngestJob,
    IngestStatus,
    InferredColumn,
    ObjectMapping,
)


# ── DataSource ────────────────────────────────────────────────────────────────
class DataSourceRead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    kind: str
    storagePath: str
    schema: list[InferredColumn]
    mappings: list[ObjectMapping]
    stubOnMissingTarget: bool
    uploadedAt: datetime


# ── 매핑 정의 갱신용 (PUT/PATCH 모두 같은 구조) ──────────────────────────────
class MappingsUpdate(BaseModel):
    mappings: list[ObjectMapping]
    stubOnMissingTarget: Optional[bool] = None


# ── Ingest 결과 ───────────────────────────────────────────────────────────────
class IngestErrorRow(BaseModel):
    rowIndex: int
    reason: str
    raw: Optional[dict[str, Any]] = None


class IngestJobRead(BaseModel):
    id: str
    dataSourceId: str
    status: IngestStatus
    createdNodes: int
    updatedNodes: int
    createdLinks: int
    skippedRows: int
    errorRows: list[dict[str, Any]]
    startedAt: datetime
    finishedAt: Optional[datetime]
    errorMessage: Optional[str]

    @classmethod
    def from_job(cls, job: IngestJob) -> "IngestJobRead":
        return cls(
            id=str(job.id),
            dataSourceId=job.dataSourceId,
            status=job.status,
            createdNodes=job.createdNodes,
            updatedNodes=job.updatedNodes,
            createdLinks=job.createdLinks,
            skippedRows=job.skippedRows,
            errorRows=job.errorRows,
            startedAt=job.startedAt,
            finishedAt=job.finishedAt,
            errorMessage=job.errorMessage,
        )


# ── 옵션 업데이트 (스텁 등) ─────────────────────────────────────────────────
class DataSourceOptions(BaseModel):
    stubOnMissingTarget: bool


__all__ = [
    "DataSourceRead",
    "MappingsUpdate",
    "IngestErrorRow",
    "IngestJobRead",
    "DataSourceOptions",
]
