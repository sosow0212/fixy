"""Neo4j 드라이버 — 단일 커넥션 풀 사용."""
from __future__ import annotations

from typing import Optional

from neo4j import AsyncGraphDatabase, AsyncDriver

from app.config import settings


_driver: Optional[AsyncDriver] = None


def get_neo4j_driver() -> AsyncDriver:
    """싱글톤 Neo4j 비동기 드라이버."""
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.neo4j_url,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


async def close_neo4j() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


async def ping_neo4j() -> bool:
    """Neo4j 연결 점검."""
    driver = get_neo4j_driver()
    try:
        async with driver.session() as s:
            await s.run("RETURN 1 AS n")
        return True
    except Exception:
        return False


async def ensure_neo4j_constraints() -> None:
    """앱 시작 시 1회 실행. IF NOT EXISTS 로 멱등 생성.

    (추측) 인제스트가 늘어날 Object Type별 primary key UNIQUE 제약은
    인제스트 시점에 동적으로 생성하므로 여기서는 전역 노드 라벨 (:FxObject) 의
    _rid UNIQUE 제약만 둔다.
    """
    driver = get_neo4j_driver()
    async with driver.session() as s:
        await s.run(
            "CREATE CONSTRAINT fx_object_rid IF NOT EXISTS "
            "FOR (n:FxObject) REQUIRE n._rid IS UNIQUE"
        )
