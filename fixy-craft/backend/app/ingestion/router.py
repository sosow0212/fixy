"""Ingestion REST 라우터."""
from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.common.errors import BadRequestError, NotFoundError
from app.ingestion import service
from app.ingestion.models import IngestJob
from app.ingestion.schemas import DataSourceRead, IngestJobRead, MappingsUpdate

router = APIRouter(prefix="/api", tags=["ingestion"])


@router.post(
    "/data-sources",
    response_model=DataSourceRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_data_source(
    name: str = Form(...),
    file: UploadFile = File(...),
) -> DataSourceRead:
    content = await file.read()
    if not content:
        raise BadRequestError("업로드된 파일이 비어있습니다.")
    ds = await service.create_data_source(
        name=name, original_filename=file.filename or "upload", content=content
    )
    return _ds_to_read(ds)


@router.get("/data-sources", response_model=list[DataSourceRead])
async def list_data_sources() -> list[DataSourceRead]:
    return [_ds_to_read(d) for d in await service.list_data_sources()]


@router.get("/data-sources/{ds_id}", response_model=DataSourceRead)
async def get_data_source(ds_id: str) -> DataSourceRead:
    ds = await service.get_data_source(ds_id)
    return _ds_to_read(ds)


@router.put("/data-sources/{ds_id}/mappings", response_model=DataSourceRead)
async def put_mappings(ds_id: str, payload: MappingsUpdate) -> DataSourceRead:
    ds = await service.update_mappings(
        ds_id=ds_id,
        mappings=payload.mappings,
        stub_on_missing_target=payload.stubOnMissingTarget,
    )
    return _ds_to_read(ds)


@router.post(
    "/data-sources/{ds_id}/ingest",
    response_model=IngestJobRead,
)
async def run_ingest(ds_id: str) -> IngestJobRead:
    job = await service.run_ingest(ds_id)
    return IngestJobRead.from_job(job)


@router.get("/ingest-jobs/{job_id}", response_model=IngestJobRead)
async def get_ingest_job(job_id: str) -> IngestJobRead:
    try:
        oid = ObjectId(job_id)
    except Exception as e:
        raise BadRequestError(f"잘못된 job id: {job_id}") from e
    job = await IngestJob.get(oid)
    if not job:
        raise NotFoundError(f"IngestJob not found: {job_id}")
    return IngestJobRead.from_job(job)


def _ds_to_read(ds) -> DataSourceRead:
    return DataSourceRead(
        id=str(ds.id),
        name=ds.name,
        kind=ds.kind,
        storagePath=ds.storagePath,
        schema=ds.schema,
        mappings=ds.mappings,
        stubOnMissingTarget=ds.stubOnMissingTarget,
        uploadedAt=ds.uploadedAt,
    )
