"""fixy-craft FastAPI 앱 진입점.

lifespan:
- Mongo(Motor + Beanie) 초기화
- Neo4j 드라이버 초기화 + 제약(IF NOT EXISTS) 부트스트랩
- 종료 시 두 클라이언트 close

라우터 등록:
- /api/object-types | /api/link-types | /api/action-types   (ontology)
- /api/data-sources   | /api/ingest-jobs                     (ingestion)
- /api/objects        | /api/graph                           (objects)
- /api/actions                                                (actions)
- /health (DB 카운트 + 연결 상태)
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.actions.router import router as actions_router
from app.common.errors import DomainError
from app.config import settings
from app.db.mongo import close_mongo, init_mongo
from app.db.neo4j import close_neo4j, ensure_neo4j_constraints, get_neo4j_driver
from app.ingestion.router import router as ingestion_router
from app.objects.router import router as objects_router
from app.ontology.router import router as ontology_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료."""
    await init_mongo()
    # Neo4j 드라이버는 lazily 시작되지만, 제약 부트스트랩을 위해 한 번 실행
    try:
        await ensure_neo4j_constraints()
    except Exception:
        # Neo4j 가 아직 부팅 중일 수 있으니 무시하고 /health 에서 진단
        pass
    yield
    await close_neo4j()
    await close_mongo()


app = FastAPI(title="fixy-craft", version="0.1.0", lifespan=lifespan)

# CORS (개발용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 도메인 에러 → HTTP 변환 ────────────────────────────────────────────────────
@app.exception_handler(DomainError)
async def _domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "status": exc.status_code,
            }
        },
    )


# ── 라우터 등록 ──────────────────────────────────────────────────────────────
app.include_router(ontology_router)
app.include_router(ingestion_router)
app.include_router(objects_router)
app.include_router(actions_router)


# ── 헬스체크 / 카운트 ────────────────────────────────────────────────────────
@app.get("/health")
async def health() -> dict:
    """Mongo + Neo4j 연결 상태 + 카운트 요약."""
    from app.actions.models import AuditLog
    from app.ingestion.models import DataSource, IngestJob
    from app.ontology.models import ActionType, LinkType, ObjectType

    out: dict = {"status": "ok", "mongo": {}, "neo4j": {}}

    # Mongo
    try:
        from app.db.mongo import get_mongo_client

        client = get_mongo_client()
        await client.admin.command("ping")
        out["mongo"] = {
            "ok": True,
            "objectTypes": await ObjectType.count(),
            "linkTypes": await LinkType.count(),
            "actionTypes": await ActionType.count(),
            "dataSources": await DataSource.count(),
            "ingestJobs": await IngestJob.count(),
            "auditLog": await AuditLog.count(),
        }
    except Exception as e:
        out["mongo"] = {"ok": False, "error": str(e)}
        out["status"] = "degraded"

    # Neo4j
    try:
        driver = get_neo4j_driver()
        async with driver.session() as s:
            r = await (await s.run(
                "MATCH (n:`FxObject`) RETURN count(n) AS nodes"
            )).single()
            e = await (await s.run(
                "MATCH ()-[r]->() RETURN count(r) AS edges"
            )).single()
            out["neo4j"] = {"ok": True, "nodes": int(r["nodes"]), "edges": int(e["edges"])}
    except Exception as e:
        out["neo4j"] = {"ok": False, "error": str(e)}
        out["status"] = "degraded"

    return out
