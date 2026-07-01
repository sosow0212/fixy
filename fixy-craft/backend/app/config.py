"""fixy-craft 설정. pydantic-settings 로 env 로드."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경 변수 한 곳에서 관리. .env 파일도 자동 로드."""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="FIXY_", extra="ignore")

    # MongoDB
    mongo_url: str = Field(
        default="mongodb://fixy:fixy_pw@mongo:27017/fixy_craft?authSource=admin",
        description="MongoDB 접속 URL",
    )
    mongo_db: str = Field(default="fixy_craft")

    # Neo4j
    neo4j_url: str = Field(default="bolt://neo4j:neo4j_pw@neo4j:7687")
    neo4j_user: str = Field(default="neo4j")
    neo4j_password: str = Field(default="neo4j_pw")

    # 업로드 디렉토리 (data source CSV/JSON 보관)
    upload_dir: str = Field(default="/data/uploads")

    # CORS
    cors_origins: str = Field(default="http://localhost:3000")

    # 페이즈 한정 상한
    graph_max_depth: int = Field(default=3, ge=1, le=5)
    graph_max_nodes: int = Field(default=500, ge=10, le=5000)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


# `from app.config import settings` 로 쓸 수 있게 별칭 노출
settings = get_settings()
