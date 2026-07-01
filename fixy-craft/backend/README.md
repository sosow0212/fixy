# fixy-craft Backend

FastAPI + MongoDB (메타데이터) + Neo4j (인스턴스 그래프) 백엔드.

## 로컬 개발

```bash
# 루트에서 docker compose 로 전체 기동
cd ..
docker compose up backend   # 또는 up 으로 전체

# 또는 로컬에서
pip install -e .
uvicorn app.main:app --reload
```

## 디렉토리

```
app/
  main.py            FastAPI 앱, lifespan
  config.py          pydantic-settings
  db/mongo.py        Motor + Beanie 초기화
  db/neo4j.py        Neo4j 드라이버
  ontology/          OMS (Object/Link/Action Type 메타 CRUD)
  ingestion/         Funnel (데이터소스 / 매핑 / 하이드레이션)
  objects/           Query (객체·그래프 조회)
  actions/           Action 실행 엔진 (writeback)
  common/            rid, errors
  scripts/           seed_demo 등 관리 스크립트
tests/
```

## 테스트

```bash
pip install -e ".[dev]"
pytest -q
```
