"""공통 픽스처 — Beanie in-memory 모킹.

mongomock-motor 는 PyMongo 4 의 list_collection_names(authorizedCollections=...) 와
호환되지 않아, 인스턴스에 바인딩된 메서드를 monkey-patch 한다.
"""
from __future__ import annotations

from typing import AsyncGenerator

import pytest

mongomock_motor = pytest.importorskip("mongomock_motor")

from app.ontology.models import ActionType, LinkType, ObjectType
from app.ingestion.models import DataSource, IngestJob
from app.actions.models import AuditLog


def _make_compatible_client():
    from mongomock_motor import AsyncMongoMockClient

    client = AsyncMongoMockClient()
    db = client["fixy_test"]
    # 인스턴스에 바인딩된 list_collection_names 호출을 가로채서 미지원 kwarg 제거.
    orig = db.list_collection_names

    async def patched(*args, **kwargs):
        kwargs.pop("authorizedCollections", None)
        kwargs.pop("nameOnly", None)
        return await orig(*args, **kwargs)

    db.list_collection_names = patched  # type: ignore[assignment]
    return db


@pytest.fixture
async def mongo_db() -> AsyncGenerator[None, None]:
    from beanie import init_beanie

    db = _make_compatible_client()
    await init_beanie(
        database=db,
        document_models=[
            ObjectType,
            LinkType,
            ActionType,
            DataSource,
            IngestJob,
            AuditLog,
        ],
    )
    yield
