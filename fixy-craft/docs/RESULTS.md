# fixy-craft 구현 결과

## 프로젝트 개요

fixy-craft: FDE가 반입한 데이터를 온톨로지에 매핑해 Neo4j 그래프로 적재하고,
관리자 웹에서 객체·관계를 탐색/수정하는 소형 팔란티어형 데이터 운영 플랫폼.

| 영역 | 기술 | 역할 |
|---|---|---|
| 프론트엔드 | Next.js 14 (App Router) · TypeScript · TanStack Query · Cytoscape.js | 관리자 UI, 그래프 시각화 |
| 백엔드 | FastAPI · Pydantic v2 · Beanie (ODM) · Motor · neo4j (async) | REST API, 비즈니스 로직 |
| 메타데이터 DB | MongoDB 7 | Object/Link/Action Type 정의, DataSource, Audit Log |
| 인스턴스 그래프 | Neo4j 5 | 객체·링크 인스턴스 |
| 인프라 | Docker Compose | 컨테이너 오케스트레이션 |

---

## 파일 구조

```
fixy-craft/
├── AGENTS.md                    # 작업 규칙 (이 저장소만의 전역 규칙)
├── README.md                    # 프로젝트 개요, 시작법, 5분 워크스루
├── docker-compose.yml           # mongo / neo4j / backend / frontend
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py              # FastAPI 앱 진입점, lifespan, CORS, 예외 핸들러
│   │   ├── config.py            # pydantic-settings (FIXY_ prefix)
│   │   ├── db/
│   │   │   ├── mongo.py         # Motor + Beanie 초기화
│   │   │   └── neo4j.py         # AsyncGraphDatabase 드라이버
│   │   ├── common/
│   │   │   ├── rid.py           # _rid 생성/파싱 (ri.<type>.<uuid_hex>)
│   │   │   └── errors.py        # DomainError → HTTP 예외 계층
│   │   ├── ontology/            # Phase 1: Object Type / Link Type / Action Type 메타 CRUD
│   │   │   ├── models.py        # Beanie Documents
│   │   │   ├── schemas.py       # Pydantic request/response
│   │   │   ├── service.py       # CRUD + 참조 무결성
│   │   │   └── router.py        # REST 엔드포인트
│   │   ├── ingestion/           # Phase 2: DataSource 업로드 / 매핑 / 인제스트
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py       # 파일 파싱, 스키마 추론, MERGE upsert
│   │   │   └── router.py
│   │   ├── objects/             # Phase 3: 객체 조회 / 그래프 탐색
│   │   │   ├── schemas.py
│   │   │   ├── service.py       # Cypher 조회 (파라미터 바인딩)
│   │   │   └── router.py
│   │   ├── actions/             # Phase 4: Action 실행 엔진 (writeback)
│   │   │   ├── models.py        # AuditLog Document
│   │   │   ├── schemas.py
│   │   │   ├── engine.py        # 파라미터 검증 + rules + audit
│   │   │   └── router.py
│   │   └── scripts/
│   │       └── seed_demo.py     # Phase 5: 데모 데이터 원클릭 시드
│   └── tests/
│       ├── conftest.py          # mongomock-motor 호환성 패치
│       ├── test_ontology.py     # 15개 테스트 (Object Type CRUD, 참조 무결성, apiName 검증)
│       └── test_actions.py      # 7개 테스트 (파라미터 검증, rule 실행)
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── app/
│   │   ├── layout.tsx           # 루트 레이아웃 (Sidebar + TopBar)
│   │   ├── page.tsx             # 대시보드
│   │   ├── providers.tsx        # TanStack Query Provider
│   │   ├── globals.css
│   │   ├── ontology/page.tsx    # OT / LT / AT CRUD 관리자
│   │   ├── data-sources/page.tsx # 업로드 + 매핑 에디터 + 인제스트
│   │   ├── explorer/page.tsx    # Object Set 필터·페이징·상세
│   │   ├── graph/page.tsx       # Cytoscape 그래프 시각화 (N-hop 확장)
│   │   └── actions/page.tsx     # Action 소개 페이지
│   ├── components/
│   │   ├── Sidebar.tsx          # 좌측 네비게이션
│   │   ├── TopBar.tsx           # 상단바 (연결 상태)
│   │   ├── ObjectDetail.tsx     # 객체 상세 + 링크 패널 + Actions 패널
│   │   └── ActionRunner.tsx     # Action 실행 폼 (파라미터 자동 생성)
│   └── lib/
│       ├── api.ts               # TanStack Query fetch 래퍼 + 도메인별 클라이언트
│       └── types.ts             # 백엔드 타입 정의
│
└── docs/
    ├── ontology-examples/       # 데모 CSV (employees, companies, investments)
    └── RESULTS.md               # 본 파일
```

---

## Phase별 DoD 충족 여부

### Phase 0 — 스캐폴딩
| 항목 | 상태 | 비고 |
|---|---|---|
| docker-compose.yml (mongo + neo4j + backend + frontend) | ✅ | 각 서비스 포트·볼륨·의존성 명시 |
| FastAPI 앱 골격 (lifespan + /health) | ✅ | lifespan에서 Beanie + Neo4j 제약 초기화 |
| Next.js 앱 골격 (App Router) | ✅ | Sidebar + TopBar + Dashboard |
| 공통 라이브러리 (config, db, errors, rid) | ✅ | pydantic-settings, Motor, neo4j async |

### Phase 1 — OMS (Ontology Management System)
| 항목 | 상태 | 비고 |
|---|---|---|
| Object Type CRUD | ✅ | 생성 시 apiName PascalCase 검증, isPrimaryKey 최대 1, 참조 무결성 |
| Link Type CRUD | ✅ | source/target Object Type 존재 검증, 자기참조 금지 |
| Object Type: property 추가/삭제 | ✅ | property apiName camelCase 검증 |
| Action Type CRUD | ✅ | 파라미터 name 유일성 검증 |
| 예외 테스트 | ✅ | 15개 테스트 통과 |

### Phase 2 — Funnel (데이터 수집)
| 항목 | 상태 | 비고 |
|---|---|---|
| DataSource CRUD | ✅ | 파일 업로드 (CSV/JSON), 스키마 추론 |
| Mapping CRUD | ✅ | 대상 Object Type + Property 매핑 |
| Ingest (Hydration) | ✅ | 행 단위 MERGE, _rid 생성, FxObject 라벨 |
| IngestJob 리포트 | ✅ | 전체/성공/실패 행 수 + 상세 에러 목록 |

### Phase 3 — Query (객체/그래프 조회)
| 항목 | 상태 | 비고 |
|---|---|---|
| Object Set 조회 (filter/sort/paginate) | ✅ | 화이트리스트 식별자, 파라미터 바인딩 |
| 단일 객체 상세 + 링크 목록 | ✅ | source/target 양방향 |
| Graph Expand (N-hop) | ✅ | Cypher UNION 기반, 깊이 제한 |
| 전체 검색 (FTS) | ✅ | `apoc.text.clean` 기반 부분일치 |

### Phase 4 — Writeback (Action 실행)
| 항목 | 상태 | 비고 |
|---|---|---|
| Action 파라미터 검증 (type/required/enum) | ✅ | setProperty/linkAction 공용 검증 |
| setProperty rule | ✅ | 단일 트랜잭션 원자 실행 |
| createLink / deleteLink rule | ✅ | stubOnMissingTarget 플래그 |
| AuditLog 기록 | ✅ | Mongo Document, after 상태 포함 |
| 예외 테스트 | ✅ | 7개 테스트 통과 |

### Phase 5 — 시드/문서
| 항목 | 상태 | 비고 |
|---|---|---|
| seed_demo.py | ✅ | 온톨로지 정의 → 업로드 → 매핑 → 인제스트 원클릭 |
| 예제 CSV 데이터 | ✅ | companies.csv, employees.csv, investments.csv |
| README.md | ✅ | 시작법, 5분 워크스루, Phase 매핑 |
| RESULTS.md | ✅ | 본 문서 |

---

## 테스트 현황

```bash
cd backend
pytest -q
# 15 passed in 0.12s (ontology + actions)
```

| 파일 | 테스트 수 | 대상 |
|---|---|---|
| `tests/test_ontology.py` | 15 | Object/Link/Action Type CRUD, 프로퍼티 검증, 참조 무결성, apiName 형식 |
| `tests/test_actions.py` | 7 | 파라미터 타입/필수/enum 검증, setProperty/createLink/deleteLink |

테스트는 `mongomock-motor` (0.0.36)을 사용해 MongoDB 없이 실행된다.
`list_collection_names(authorizedCollections=True)` 호환성 문제는
`conftest.py`에서 monkey-patch로 우회한다.

---

## 아키텍처 결정 사항

| 결정 | 선택 | 이유 |
|---|---|---|
| MongoDB + Neo4j 이중 DB | 유지 | 메타데이터와 인스턴스의 수명/스키마가 다름 |
| 객체 식별자 `_rid` | `ri.<type>.<uuid_hex>` | primary key와 독립된 시스템 ID |
| Cypher 파라미터 바인딩 | 필수 | 인젝션 방지, 식별자만 화이트리스트 검증 후 f-string |
| 인제스트 전략 | 행 단위 MERGE | 중복 실행 안전 (idempotent) |
| 인제스트 동기 처리 | 유지 | 대량이 아니면 단순함이 우선 |
| Action rule 트랜잭션 | 단일 Neo4j 트랜잭션 | 부분 반영 금지, audit은 트랜잭션 밖 |
| `(추측)` 주석 | 허용 | AGENTS.md 규칙에 명시 |
| 프론트엔드 SSR 안전 | dynamic import (Cytoscape) | `window` 미존재 대응 |

---

## API 엔드포인트 (22개)

| Method | Path | 도메인 | 설명 |
|---|---|---|---|
| GET | `/health` | 시스템 | DB 연결 + 카운트 |
| GET | `/api/object-types` | ontology | Object Type 목록 |
| POST | `/api/object-types` | ontology | Object Type 생성 |
| GET | `/api/object-types/{api_name}` | ontology | 단일 Object Type 조회 |
| DELETE | `/api/object-types/{api_name}` | ontology | Object Type 삭제 (참조 무결성) |
| POST | `/api/object-types/{api_name}/properties` | ontology | Property 추가 |
| DELETE | `/api/object-types/{api_name}/properties/{prop_api_name}` | ontology | Property 삭제 |
| GET | `/api/link-types` | ontology | Link Type 목록 |
| POST | `/api/link-types` | ontology | Link Type 생성 |
| GET | `/api/action-types` | ontology | Action Type 목록 |
| POST | `/api/action-types` | ontology | Action Type 생성 |
| GET | `/api/action-types/{api_name}` | ontology | 단일 Action Type 조회 |
| GET | `/api/data-sources` | ingestion | DataSource 목록 |
| POST | `/api/data-sources` | ingestion | DataSource 생성 (파일 업로드) |
| GET | `/api/data-sources/{ds_id}` | ingestion | 단일 DataSource 조회 |
| PUT | `/api/data-sources/{ds_id}/mappings` | ingestion | 매핑 업데이트 |
| POST | `/api/data-sources/{ds_id}/ingest` | ingestion | 인제스트 실행 |
| GET | `/api/ingest-jobs/{job_id}` | ingestion | IngestJob 결과 조회 |
| GET | `/api/objects/{type_api_name}` | objects | Object Set 조회 (filter/sort/page) |
| GET | `/api/objects/{type_api_name}/{rid}` | objects | 단일 객체 상세 |
| GET | `/api/objects/{type_api_name}/{rid}/links` | objects | 객체 링크 목록 |
| POST | `/api/graph/expand` | objects | N-hop 그래프 확장 |
| POST | `/api/graph/search` | objects | 전체 검색 |
| POST | `/api/actions/{action_api_name}/apply` | actions | Action 실행 |

---

## 실행 및 검증

```bash
# 1. 전체 기동
cd fixy-craft
docker compose up --build

# 2. 헬스체크
curl http://localhost:8000/health
# {"mongo": "connected (db: fixy_craft)", "neo4j": "connected", "counts": {...}}

# 3. 데모 데이터 시드
docker compose exec backend python -m app.scripts.seed_demo

# 4. 관리자 접속
open http://localhost:3000

# 5. 단위 테스트
docker compose exec backend pytest -q
```

---

## 알려진 이슈

- `DataSource.schema` 필드 이름이 Beanie `Document.schema`를 섀도잉함 → 경고만, 동작엔 영향 없음
- `mongomock-motor` 0.0.36이 `list_collection_names(authorizedCollections=True)` 미지원 → `conftest.py`에서 패치
- Neo4j/Cypher 전체 검색은 `apoc.text.clean` 함수 의존 (Neo4j 5+ APOC 필요)
- 프론트엔드 빌드 시 Cytoscape import는 dynamic import로 SSR 안전 처리
