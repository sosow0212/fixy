"""MongoDB (Motor + Beanie) 연결 관리."""
from __future__ import annotations

from typing import Optional

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


_client: Optional[AsyncIOMotorClient] = None


def get_mongo_client() -> AsyncIOMotorClient:
    """싱글톤 Motor 클라이언트."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_url, uuidRepresentation="standard")
    return _client


async def init_mongo() -> None:
    """앱 시작 시 Beanie 초기화. 도메인 모듈에서 import 한 Document 모델을 등록한다.

    Phase 0 에서는 도메인 모델이 없으므로 init_beanie(document_models=[]) 로
    컬렉션을 만든다 (Phase 1 부터 실제 Document 들을 import 해서 여기에 누적).
    """
    from app.ontology.models import ActionType, LinkType, ObjectType
    from app.ingestion.models import DataSource, IngestJob
    from app.actions.models import AuditLog

    client = get_mongo_client()
    await init_beanie(
        database=client[settings.mongo_db],
        document_models=[
            ObjectType,
            LinkType,
            ActionType,
            DataSource,
            IngestJob,
            AuditLog,
        ],
    )


async def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def ping_mongo() -> bool:
    """MongoDB 연결 점검. (추측) 단순히 admin.command('ping') 시도."""
    client = get_mongo_client()
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False
