# fixy-craft

> **fixy-craft** — FDE가 반입한 데이터를 온톨로지에 매핑해 **Neo4j 그래프**로 적재하고,
> 관리자 웹에서 객체·관계를 탐색하고 Action 으로 수정할 수 있게 하는 소형
> 팔란티어형 데이터 운영 플랫폼(내부 OS)이다.

## 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Next.js (App Router) · TypeScript · TanStack Query · Cytoscape.js |
| 백엔드 | FastAPI · Pydantic v2 · Beanie (ODM) · Motor |
| 메타데이터 | MongoDB 7 |
| 인스턴스 | Neo4j 5 (FxObject 공통 라벨 + _rid UNIQUE 제약) |
| 인프라 | Docker Compose |
| 테스트 | pytest (+ mongomock-motor) |

## 디렉토리

```
fixy-craft/
  AGENTS.md                 # 10장 — 전역 규칙
  README.md
  docker-compose.yml
  backend/                  # 5장 디렉토리 구조
  frontend/                 # Next.js
  docs/
    blueprint.md            # 1~9장 설계 원본
    RESULTS.md              # 구현 결과물 요약 문서
    ontology-examples/      # 데모 데이터
```

## 시작

```bash
cd fixy-craft
docker compose up --build
```

기동 후:

| URL | 설명 |
|---|---|
| http://localhost:3000 | Next.js 관리자 |
| http://localhost:8000 | FastAPI 백엔드 |
| http://localhost:8000/docs | OpenAPI 문서 |
| http://localhost:8000/health | DB 연결 + 카운트 |
| http://localhost:7474 | Neo4j 브라우저 (`neo4j` / `neo4j_pw`) |
| mongodb://localhost:27017 | MongoDB (`fixy` / `fixy_pw`) |

## 5분 워크스루 — 데모 시드

```bash
# 컨테이너 안에서 실행 (또는 호스트에서 backend/.venv 후)
docker compose exec backend python -m app.scripts.seed_demo
```

위 명령은 다음을 한 번에 수행한다:

1. `Person`, `Company` Object Type 생성 (`employeeId`, `name`, `role`, `hireDate`, `companyId` 등)
2. `WORKS_AT`, `INVESTED_IN` Link Type 생성
3. `assignRole` Action Type 생성 (setProperty + audit)
4. companies.csv → 매핑 → 인제스트
5. employees.csv → 매핑 → 인제스트 (WORKS_AT 링크 자동 생성)
6. investments.csv → 매핑 → 인제스트 (INVESTED_IN 링크)

그 다음:

1. http://localhost:3000/explorer → `Person` 선택 → 이름에 "길동" 검색 → 행 클릭
2. 상세 패널의 Actions 에서 `assignRole` 실행 → newRole = "Senior Engineer"
3. http://localhost:3000/graph → "길동" 검색 → 한 인물에서 회사·동료로 그래프 펼치기

## Phase 매핑

이 저장소의 코드는 기획서의 Phase 0 → Phase 5 전부를 구현한다.

| Phase | 위치 |
|---|---|
| Phase 0 (스캐폴딩) | `docker-compose.yml`, `backend/app/main.py`, `backend/app/{db,config}.py`, `frontend/app/{layout,page,providers}.tsx`, `frontend/components/{Sidebar,TopBar}.tsx` |
| Phase 1 (OMS) | `backend/app/ontology/{models,schemas,service,router}.py`, `frontend/app/ontology/page.tsx`, `tests/test_ontology.py` |
| Phase 2 (Funnel) | `backend/app/ingestion/{models,schemas,service,router}.py`, `frontend/app/data-sources/page.tsx` |
| Phase 3 (Query) | `backend/app/objects/{schemas,service,router}.py`, `frontend/app/explorer/page.tsx`, `frontend/app/graph/page.tsx`, `frontend/components/ObjectDetail.tsx` |
| Phase 4 (Writeback) | `backend/app/actions/{models,schemas,engine,router}.py`, `frontend/components/ActionRunner.tsx`, `tests/test_actions.py` |
| Phase 5 (Seed) | `backend/app/scripts/seed_demo.py`, `docs/ontology-examples/*.csv`, `docs/RESULTS.md` |

## 환경 변수 (env)

루트 `.env` (또는 환경):

```
MONGO_USER=fixy
MONGO_PASSWORD=fixy_pw
MONGO_DB=fixy_craft
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_pw
```

`docker-compose.yml` 이 이 값을 컨테이너 주입 + 백엔드의 `app/config.py` 가
`FIXY_MONGO_URL` / `FIXY_NEO4J_URL` 등 `FIXY_` prefix 로 env 오버라이드를 받는다.

## 개발 명령

```bash
# 백엔드 단독 실행 (로컬 venv)
cd backend
pip install -e ".[dev]"
pytest -q
uvicorn app.main:app --reload

# 프론트 단독 실행
cd frontend
npm install
npm run dev
```
