# fixy-craft — 팔란티어형 온톨로지 플랫폼 설계 & 에이전틱 코딩 블루프린트

## 2. fixy-craft가 만들 것 (스코프)

### 2.1 한 문장 정의
> **fixy-craft**는 FDE가 반입한 원본 데이터를 사용자가 정의한 **온톨로지**에 매핑해 **그래프 DB(Neo4j)** 로 적재하고, 관리자 웹에서 객체·관계를 탐색하고 Action으로 수정할 수 있게 하는 소형 팔란티어형 데이터 운영 플랫폼(내부 OS)이다.

### 2.2 MVP 범위 (넣는다)
1. **온톨로지 매니저**: Object Type / Property / Link Type / Action Type 정의 CRUD.
2. **데이터소스 반입**: CSV/JSON 업로드 → 데이터소스로 등록.
3. **매핑 & 하이드레이션**: 데이터소스 컬럼 → Object Type 속성 매핑을 정의하고, 실행하면 Neo4j에 노드/관계 upsert.
4. **객체 탐색**: 필터 검색(Object Set), 단일 객체 상세 + 연결된 객체, N-hop 그래프 탐색.
5. **Action 실행**: 정의된 Action Type을 파라미터와 함께 실행 → 검증 → 객체/링크 수정 → 감사 로그(부수효과).
6. **관리자 프론트엔드**: 위 기능을 다루는 웹 UI + 그래프 시각화.

### 2.3 비범위 (지금은 안 넣는다) (추측)
- 실시간 스트리밍 인제스트 (배치 업로드만)
- 세밀한 동적 보안(RBAC)은 골격만 — 관리자 단일 롤로 시작
- 파이프라인 자동 코드 생성(Pipeline Builder급), 모델 바인딩(AI/ML)
- 멀티테넌시, SSO
- 되돌리기/브랜치(시나리오 분석)

> 이유(추측): 사이드 프로젝트이므로 "온톨로지 → 그래프 → 탐색 → writeback"이라는 팔란티어의 뼈대 한 사이클을 먼저 완성하는 데 집중. 위 항목들은 뼈대가 돌아간 뒤 확장.

### 2.4 팔란티어 개념 ↔ fixy-craft 매핑
| 팔란티어 | fixy-craft 구현 |
|---|---|
| Ontology | MongoDB의 메타데이터 + Neo4j의 인스턴스 그래프 |
| Object Type | `object_types` 컬렉션 문서 + Neo4j 라벨 |
| Object | Neo4j 노드 |
| Property | `object_types` 문서에 embed된 배열 + 노드 프로퍼티 |
| Link Type | `link_types` 컬렉션 문서 + Neo4j 관계 타입 |
| Link | Neo4j 관계(edge) |
| Action Type | `action_types` 컬렉션 문서(정의 embed) + 실행 엔진 |
| Ontology Hydration / Funnel | 매핑 기반 인제스트 서비스 |
| OMS | 메타데이터 CRUD API |

---

## 3. 시스템 아키텍처

### 3.1 구성도
```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 관리자 프론트엔드 (App Router, TypeScript)            │
│  · 온톨로지 매니저  · 데이터소스/매핑  · 객체 탐색            │
│  · 그래프 뷰       · Action 실행 UI                          │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST/JSON (OpenAPI)
┌───────────────────────────▼─────────────────────────────────┐
│  FastAPI 백엔드 (Python 3.12+)                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │ Ontology   │ │ Ingestion  │ │ Object     │ │ Action    │ │
│  │ (OMS)      │ │ (Funnel)   │ │ Query      │ │ Engine    │ │
│  │ 메타 CRUD  │ │ 매핑/적재  │ │ 조회/탐색  │ │ writeback │ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬─────┘ │
└────────┼──────────────┼──────────────┼──────────────┼───────┘
         │ 메타데이터    │ 노드/관계 write             │ 감사로그
   ┌─────▼────────┐  ┌──▼──────────────────▼──┐  ┌────▼──────┐
   │ MongoDB      │  │        Neo4j           │  │ MongoDB   │
   │ 온톨로지 정의 │  │ 객체 인스턴스 + 링크   │  │ audit_log │
   │ 데이터소스   │  │  (그래프)              │  │ 컬렉션    │
   │ 매핑         │  └────────────────────────┘  └───────────┘
   └──────────────┘
```

### 3.2 왜 MongoDB + Neo4j 둘 다인가 `[확정]`+(추측)
- `[확정]` 팔란티어도 **정의(메타데이터)** 를 관리하는 서비스와 **인스턴스 데이터**를 저장하는 서비스를 분리한다(OMS ↔ Object DB). 개념적으로 서로 성격이 다르다.
- **Neo4j = 객체 인스턴스와 관계**: "홍길동이 A회사에서 일하고, A회사가 B회사에 투자했고…" 같은 다중 홉 관계 탐색은 그래프 DB의 본령. `MATCH (p)-[:WORKS_AT]->(c)` 한 줄로 표현된다. **진짜 관계·그래프 쿼리는 전부 Neo4j가 담당**한다.
- **MongoDB = 온톨로지 정의·데이터소스·감사**: 여기서 관계형이 맡던 일은 관계 탐색이 아니라 "정의 문서 저장"이다. 그리고 그 정의들(`action_types.definition`, 매핑, 추론 스키마)은 애초에 반정형 JSON이라 문서 DB의 본령이다(관계형에선 JSONB로 우회하던 것). 또 Object Type과 그 Property들을 **한 문서에 embed**할 수 있어 조인이 사라진다.
- (추측) 즉 이 프로젝트에서 관계형의 강점(조인)이 결정적으로 필요한 지점이 거의 없어, MongoDB가 오히려 더 자연스럽다. 두 저장소는 역할이 겹치지 않는다.

**트레이드오프(추측)**: MongoDB엔 FK 제약이 없다. "링크의 source/target이 존재하는 Object Type인지", "링크가 걸린 Object Type 삭제 거부" 같은 **참조 무결성을 service 계층에서 직접 구현**해야 한다. 다만 이 검증들은 원래 설계에서도 service에서 하기로 했으니 실질 부담 증가는 작다. Action 실행의 원자성은 실제 데이터 변경(rules)이 Neo4j 트랜잭션 안에서 일어나고 MongoDB는 감사 로그 기록 정도라, 크로스-DB 트랜잭션 이슈는 없다.

> **더 빨리 MVP를 보고 싶다면(대안, 추측)**: Phase 1을 Neo4j 단독으로 시작해 메타데이터도 `:_ObjectTypeDef` 같은 특수 노드로 저장할 수 있다. 단, 정의 문서를 그래프에 욱여넣는 셈이라 관리가 지저분해진다. **권장은 처음부터 2-DB(MongoDB + Neo4j) 구성.**

### 3.3 데이터 흐름 (하이드레이션 한 사이클)
1. (사람) 온톨로지 매니저에서 `Person`, `Company` Object Type과 `WORKS_AT` Link Type 정의 → MongoDB 저장.
2. (FDE) `employees.csv` 업로드 → 데이터소스 등록(MongoDB) + 원본 파일 보관.
3. (사람) 매핑 정의: CSV의 `emp_name`→`Person.name`, `company_id`→`WORKS_AT` 링크 대상 등 → MongoDB 저장(`data_sources.mappings`).
4. (시스템) 인제스트 실행: Ingestion 서비스가 CSV를 읽고 매핑대로 Neo4j에 노드/관계 **upsert**(primary key 기준).
5. (사람) 객체 탐색·그래프 뷰로 확인. Action으로 수정 → Neo4j 반영 + 감사 로그.

---

## 4. 데이터 모델

### 4.1 MongoDB — 온톨로지 메타데이터 (핵심 컬렉션)
> 아래는 개념 문서 구조다. 실제 필드는 Phase 1에서 Beanie Document 모델로 확정한다.
> 관계형과 달리 FK 제약이 없으므로, 참조 무결성(존재 검증·삭제 거부)은 service 계층에서 구현한다.

**`object_types` 컬렉션** — Property를 문서에 embed (조인 불필요)
```json
{
  "_id": "ObjectId(...)",
  "apiName": "Person",           // 코드/그래프 라벨용, PascalCase, 유니크 인덱스
  "displayName": "인물",
  "description": null,
  "icon": null,
  "properties": [
    {
      "apiName": "employeeId",   // camelCase
      "displayName": "사번",
      "dataType": "string",      // string|integer|double|boolean|date|timestamp|geo
      "isRequired": true,
      "isPrimaryKey": true,      // upsert 기준. Object Type당 정확히 1개(서비스 계층 검증)
      "isTitle": false
    },
    {
      "apiName": "name", "displayName": "이름", "dataType": "string",
      "isRequired": true, "isPrimaryKey": false, "isTitle": true
    }
  ],
  "createdAt": "...", "updatedAt": "..."
}
```

**`link_types` 컬렉션**
```json
{
  "apiName": "WORKS_AT",              // 그래프 관계 타입, SCREAMING_SNAKE, 유니크 인덱스
  "displayName": "근무",
  "sourceObjectTypeApiName": "Person",
  "targetObjectTypeApiName": "Company",
  "cardinality": "MANY_TO_MANY"       // ONE_TO_ONE|ONE_TO_MANY|MANY_TO_MANY
}
```
> 참조는 ObjectId 대신 `apiName`으로 건다(추측). 그래프 라벨·관계 타입과 표기가 일치해 디버깅이 쉽고, 인제스트/조회 코드가 apiName만으로 동작한다. 존재 검증은 service에서.

**`action_types` 컬렉션** — 정의(파라미터/규칙/효과)를 문서에 embed
```json
{
  "apiName": "assignRole",
  "displayName": "역할 배정",
  "targetObjectTypeApiName": "Person",
  "definition": { /* 4.4 참고: parameters / rules / effects */ }
}
```

**`data_sources` 컬렉션** — 추론 스키마와 매핑을 함께 보관
```json
{
  "_id": "ObjectId(...)",
  "name": "employees.csv",
  "kind": "csv",                       // csv|json
  "storagePath": "/data/uploads/....csv",
  "schema": [ { "column": "emp_id", "inferredType": "string" } ],
  "mappings": [ { /* 4.3 참고: objectTypeApiName + 컬럼→속성 + 링크 규칙 */ } ],
  "uploadedAt": "..."
}
```
> 원래 분리했던 `ingestion_mappings`는 `data_sources.mappings` 배열로 embed한다. 매핑은 항상 소속 데이터소스와 함께 읽고 쓰이므로 한 문서에 두는 게 자연스럽다(추측).

**`audit_log` 컬렉션**
```json
{ "actionType": "assignRole", "actor": "admin", "payload": {}, "createdAt": "..." }
```

권장 인덱스(Phase 1에서 생성): `object_types.apiName`, `link_types.apiName`, `action_types.apiName` 각각 유니크.

### 4.2 Neo4j — 객체 인스턴스 그래프
매핑 규칙(`[확정]` 온톨로지 개념을 그래프에 대응):
- **Object Type → 라벨**: `Person` Object Type → 노드 라벨 `:Person`. 추가로 전역 공통 라벨 `:FxObject`를 함께 붙인다 (추측: 타입 무관 전역 검색/삭제 편의).
- **Object → 노드**: `(:Person:FxObject { _rid, _typeApiName, name, ... })`
  - `_rid` (추측): fixy-craft가 부여하는 안정적 고유 ID (예: `ri.person.<uuid>`). primary key 값과 별개로 시스템 내부 참조에 사용.
  - `_typeApiName`: 소속 Object Type의 apiName (역참조·검증용).
  - 사용자 정의 property는 노드 프로퍼티로 그대로.
- **Link Type → 관계 타입**: `WORKS_AT` → `[:WORKS_AT]`
- **Link → 관계(edge)**: `(:Person)-[:WORKS_AT {_rid, since}]->(:Company)`

권장 제약/인덱스(Phase 2에서 생성):
```cypher
CREATE CONSTRAINT fx_object_rid IF NOT EXISTS
  FOR (n:FxObject) REQUIRE n._rid IS UNIQUE;
// Object Type별 primary key 유니크 제약은 인제스트 시 동적으로 관리
```

### 4.3 매핑 정의 예시 (`data_sources.mappings[]` 항목)
```json
{
  "objectTypeApiName": "Person",
  "primaryKey": { "column": "emp_id", "property": "employeeId" },
  "properties": [
    { "column": "emp_name", "property": "name" },
    { "column": "hire_date", "property": "hireDate", "transform": "to_date" }
  ],
  "links": [
    {
      "linkTypeApiName": "WORKS_AT",
      "direction": "OUT",
      "target": {
        "objectTypeApiName": "Company",
        "matchColumn": "company_id",
        "matchProperty": "companyId"
      }
    }
  ]
}
```
인제스트 규칙(추측): primaryKey 기준 `MERGE`(upsert), 링크는 대상 노드를 matchProperty로 찾아 `MERGE` 관계 생성. 대상 노드가 없으면 스텁 노드 생성 옵션(설정 가능).

### 4.4 Action Type 정의 예시 (`action_types.definition`)
```json
{
  "parameters": [
    { "name": "targetRid", "type": "objectRid", "required": true },
    { "name": "newRole", "type": "string", "required": true,
      "allowed": ["Engineer", "Product Manager", "Designer"] }
  ],
  "rules": [
    { "type": "setProperty", "objectParam": "targetRid",
      "property": "role", "valueParam": "newRole" }
  ],
  "effects": [
    { "type": "audit", "message": "role changed" }
  ]
}
```
실행 엔진(추측): 파라미터 검증(타입/allowed/required) → rules를 트랜잭션 안에서 Neo4j에 적용 → effects 실행(감사 로그 기록, 향후 webhook). 하나라도 실패하면 롤백.

---

## 5. 백엔드 설계 (FastAPI)

### 5.1 디렉토리 구조 (추측 — 과도한 분리 지양, 도메인 4개로만 묶음)
```
backend/
  app/
    main.py                 # FastAPI 앱, 라우터 등록
    config.py               # 설정(env)
    db/
      mongo.py              # Motor 클라이언트 + Beanie 초기화
      neo4j.py              # Neo4j 드라이버 (단일 커넥션 풀)
    ontology/               # OMS: 메타데이터 도메인
      models.py             # Beanie Document (Pydantic 문서 모델)
      schemas.py            # 요청/응답 Pydantic
      service.py
      router.py
    ingestion/              # Funnel: 데이터소스 + 매핑 + 하이드레이션
      schemas.py
      service.py            # CSV/JSON 파싱, 매핑 적용, Neo4j upsert
      router.py
    objects/                # 객체/그래프 조회
      schemas.py
      service.py            # Cypher 쿼리 빌더
      router.py
    actions/                # Action 실행 엔진
      schemas.py
      engine.py             # 파라미터 검증 + rules 적용 + effects
      router.py
    common/
      rid.py                # _rid 생성/파싱
      errors.py
  tests/
  pyproject.toml
```
> 도메인을 `ontology / ingestion / objects / actions` 4개로만 나눈다. 각 도메인은 `schemas / service / router`의 얇은 3층. 레이어를 더 쪼개지 않는다(가독성 우선).

### 5.2 핵심 API (초안)
```
# Ontology (OMS)
POST   /api/object-types                 Object Type 생성
GET    /api/object-types                 목록
GET    /api/object-types/{apiName}       상세(+properties)
POST   /api/object-types/{apiName}/properties   Property 추가
POST   /api/link-types                   Link Type 생성
GET    /api/link-types
POST   /api/action-types                 Action Type 생성
GET    /api/action-types

# Ingestion (Funnel)
POST   /api/data-sources                 파일 업로드(멀티파트) → 스키마 추론
GET    /api/data-sources
POST   /api/data-sources/{id}/mappings   매핑 정의
POST   /api/data-sources/{id}/ingest     하이드레이션 실행(비동기 잡 or 동기)
GET    /api/ingest-jobs/{jobId}          진행상태

# Objects (Query)
GET    /api/objects/{typeApiName}                필터·페이지네이션(Object Set)
GET    /api/objects/{typeApiName}/{rid}          단일 객체 + 링크 요약
GET    /api/objects/{typeApiName}/{rid}/links    연결된 객체
POST   /api/graph/expand                         N-hop 이웃 탐색(그래프 뷰용)
POST   /api/graph/search                         전역 검색

# Actions
POST   /api/actions/{actionApiName}/apply        파라미터로 Action 실행
```

---

## 6. 프론트엔드 설계 (Next.js 관리자)

`[확정 스코프]` 관리자 페이지 중심. 화면 목록(추측):

1. **Ontology Manager**
   - Object Type 목록/생성/편집, Property 편집(테이블 UI)
   - Link Type 목록/생성(소스·타깃 Object Type 선택, 카디널리티)
   - Action Type 편집(JSON 에디터 + 폼)
2. **Data Sources**
   - 업로드(드래그앤드롭), 추론된 스키마 미리보기
   - 매핑 편집기: 좌측 CSV 컬럼 ↔ 우측 Object Type 속성 연결, 링크 규칙 추가
   - "Ingest" 실행 버튼 + 진행상태
3. **Object Explorer**
   - Object Type 선택 → 필터·검색된 객체 테이블
   - 행 클릭 → 객체 상세 패널(속성 + 연결된 객체)
4. **Graph View**
   - 특정 객체에서 시작해 링크를 펼쳐보는 인터랙티브 그래프
   - 라이브러리(추측): `Cytoscape.js`(react-cytoscapejs) 또는 `react-force-graph` 중 택1. 초기엔 Cytoscape 권장(레이아웃·안정성).
5. **Actions**
   - Object Explorer 상세에서 해당 객체에 적용 가능한 Action 목록 → 파라미터 폼 → 실행 → 결과/감사 로그 확인

UI 라이브러리(추측): `shadcn/ui` + Tailwind, 데이터 패칭은 `TanStack Query`, 폼은 `react-hook-form` + `zod`.

> 실제 프론트 컴포넌트를 코딩할 때는 이 저장소의 `frontend-design` 스킬 가이드(디자인 토큰/타이포)를 함께 참고할 것.

---

## 7. 기술 스택 & 버전

> 착수 시점에 각 패키지 최신 안정 버전을 확인하고 고정할 것. 아래는 기준선(추측).

**Backend**
- Python 3.12+
- FastAPI + Uvicorn
- Pydantic v2
- MongoDB 7 + Motor(공식 async 드라이버) + Beanie(Pydantic v2 기반 ODM). Beanie로 문서 모델을 Pydantic 클래스로 정의 → FastAPI·Pydantic과 궁합이 좋고 Alembic 같은 스키마 마이그레이션이 불필요(추측: odmantic 등 대안도 있으나 Beanie가 생태계·async 지원에서 앞섬).
- Neo4j 5.x + 공식 `neo4j` 파이썬 드라이버 (OGM인 `neomodel`은 초기엔 미사용 — 원시 Cypher가 학습·디버깅에 유리, 추측)
- 파일 파싱: `pandas` 또는 표준 `csv`+`json` (규모 작으면 표준 라이브러리로 충분, 추측)
- 테스트: `pytest` (+ `pytest-asyncio`)

**Frontend**
- Next.js (App Router) + TypeScript
- TanStack Query, react-hook-form, zod
- Tailwind + shadcn/ui
- 그래프: react-cytoscapejs (Cytoscape.js)

**Infra**
- Docker Compose: `mongo`, `neo4j`, `backend`, `frontend`
- MongoDB는 `mongo:7` 이미지(27017 노출). 멀티도큐먼트 트랜잭션이 필요해지면 단일 노드 레플리카셋으로 기동(현재 MVP는 단일 문서 원자성으로 충분, 추측)
- Neo4j는 `neo4j:5-community` 이미지, 브라우저(7474)/볼트(7687) 노출

---

## 8. 리포지토리 구조 (모노레포)
```
fixy-craft/
  AGENTS.md                 # 10장 내용 (전역 규칙)
  docker-compose.yml
  README.md
  backend/                  # 5장 구조
  frontend/                 # Next.js
  docs/
    blueprint.md            # 이 문서
    ontology-examples/      # 예제 온톨로지·데이터소스(데모 시드)
```

---

## 9. 에이전틱 코딩 실행 계획 (Phase별 프롬프트)

각 Phase는 **그대로 복사해 에이전트에 넣는** 프롬프트다. 사람이 DoD를 확인한 뒤 다음 Phase로.
공통 전제: 에이전트는 반드시 레포 루트의 `AGENTS.md`(10장)를 먼저 읽는다.

---

### Phase 0 — 스캐폴딩 & 인프라

```
목표: fixy-craft 모노레포의 뼈대와 로컬 개발 인프라를 만든다. 비즈니스 로직은 아직 없다.

작업:
1. 다음 구조로 디렉토리를 만든다:
   fixy-craft/
     backend/  frontend/  docs/
     docker-compose.yml  README.md  AGENTS.md
2. docker-compose.yml 작성:
   - service `mongo` (mongo:7), 볼륨, 27017 노출
   - service `neo4j` (neo4j:5-community), 7474/7687 노출, 초기 비밀번호 env
   - service `backend` (아래 FastAPI, 8000 노출, mongo·neo4j에 depends_on)
   - service `frontend` (Next.js, 3000 노출)
3. backend/ 를 5.1의 디렉토리 구조로 스캐폴딩:
   - pyproject.toml (fastapi, uvicorn, pydantic v2, motor, beanie, neo4j, pandas, pytest, pytest-asyncio)
   - app/main.py: FastAPI 앱 + GET /health (mongo·neo4j 커넥션 ping 포함), lifespan에서 Beanie 초기화
   - app/config.py: pydantic-settings로 DB 접속정보 로드
   - app/db/mongo.py: Motor 클라이언트 + Beanie init, app/db/neo4j.py: 드라이버 팩토리
   - 마이그레이션 도구 없음 (MongoDB는 스키마리스)
4. frontend/ 를 Next.js(App Router, TypeScript)로 스캐폴딩:
   - Tailwind + shadcn/ui 초기 설정
   - TanStack Query Provider 세팅
   - / 페이지에 "fixy-craft" 대시보드 껍데기 + 좌측 네비게이션(Ontology / Data Sources / Explorer / Graph / Actions) 라우트 골격만
   - lib/api.ts: 백엔드 base URL을 env로, fetch 래퍼
5. README.md: `docker compose up`으로 전체 기동하는 방법.

완료 기준(DoD):
- `docker compose up`으로 4개 서비스가 뜬다.
- GET http://localhost:8000/health 가 mongo/neo4j 연결 OK를 반환.
- http://localhost:3000 에서 네비게이션이 보인다(내용은 비어있어도 됨).

주의: 이 Phase에서는 도메인 로직/Document 모델을 만들지 않는다. Beanie 초기화 골격만 두고 컬렉션 모델은 Phase 1에서 추가한다.
```

**DoD 확인 포인트(사람)**: health 응답 JSON, 프론트 네비 렌더링.

---

### Phase 1 — 온톨로지 메타데이터 (OMS)

```
목표: Object Type / Property / Link Type / Action Type의 "정의"를 MongoDB에 저장·관리하는 API와 관리 UI를 만든다.

전제: Phase 0 완료.

백엔드 작업 (app/ontology):
1. Beanie Document 모델: 4.1의 object_types(properties embed), link_types, action_types 컬렉션을 구현.
   - apiName 규칙 검증: Object Type=PascalCase, Property=camelCase, Link Type=SCREAMING_SNAKE_CASE.
   - Object Type당 isPrimaryKey=true 인 property는 최대 1개(서비스 계층에서 검증).
   - apiName 유니크 인덱스(object_types / link_types / action_types)를 Beanie 인덱스로 선언.
2. (마이그레이션 단계 없음 — 컬렉션은 첫 write 시 생성되고, 인덱스는 Beanie init에서 보장한다)
3. 요청/응답 Pydantic 스키마 + service + router로 5.2의 Ontology 엔드포인트 구현.
   - Link Type 생성 시 source/target Object Type 존재를 service에서 조회·검증(FK가 없으므로 앱이 책임진다).
   - action_types.definition 은 4.4 형태를 pydantic으로 느슨히 검증(파라미터 name 유일성 정도).
4. 삭제 정책: Object Type 삭제 시 이를 참조하는 Link Type이 있으면 409로 거부(service에서 apiName으로 역참조 조회).

프론트엔드 작업 (Ontology Manager 화면):
1. Object Type 목록/생성/상세. 상세에서 Property 테이블 편집(추가/삭제, data_type 드롭다운, primary key/title 토글).
2. Link Type 목록/생성(소스·타깃 Object Type 셀렉트, 카디널리티).
3. Action Type: 기본 폼 + definition JSON 에디터.
4. 모든 통신은 TanStack Query. 낙관적 업데이트는 하지 말 것(단순하게).

테스트:
- object-type 생성→property 추가→link-type 생성 happy path.
- 예외: 잘못된 apiName, primary key 2개, 존재하지 않는 object type으로 link 생성, 링크가 있는 object type 삭제.

완료 기준(DoD):
- UI에서 Person, Company Object Type과 각 속성, WORKS_AT Link Type을 만들 수 있고 새로고침해도 유지된다.
- 위 예외들이 적절한 상태코드/메시지로 거부된다.

제약: 기존 파일의 동작을 바꾸지 말고 추가만. 커밋하지 말 것. 예외 테스트를 꼼꼼히.
```

**DoD 확인 포인트**: Person/Company/WORKS_AT 생성 후 DB 확인, 예외 응답.

---

### Phase 2 — 데이터소스 & 하이드레이션 (Funnel)

```
목표: FDE가 반입한 파일을 업로드하고, 온톨로지에 매핑해, Neo4j에 객체·링크로 적재(hydration)한다.

전제: Phase 1 완료. (Object/Link Type이 존재해야 매핑 가능)

백엔드 작업 (app/ingestion):
1. 파일 업로드 API(멀티파트): CSV/JSON 저장(storagePath) + 컬럼/타입 추론 → data_sources.schema.
2. 매핑 API: 4.3 매핑 항목을 검증하며 data_sources.mappings에 저장.
   - primaryKey.property 는 대상 Object Type의 isPrimaryKey 속성과 일치해야 함.
   - links[].linkTypeApiName 은 존재하는 Link Type이어야 하고, 방향/타깃 타입이 정의와 일치해야 함(FK가 없으므로 service에서 조회·검증).
3. Neo4j 제약/인덱스 부트스트랩: FxObject._rid UNIQUE (4.2). 앱 시작 시 IF NOT EXISTS로 생성.
4. 하이드레이션 실행 API:
   - 파일을 스트리밍/청크로 읽어 각 행을 매핑 적용.
   - 노드 upsert: MERGE (n:<Label>:FxObject { <pkProperty>: $pk }) 후 SET 나머지 속성, _rid 없으면 생성, _typeApiName 세팅.
   - 링크 upsert: 타깃을 matchProperty로 MATCH/MERGE 후 MERGE 관계.
   - 결과 요약 반환: 생성/갱신 노드 수, 생성 링크 수, 스킵/오류 행.
   - 규모가 작으면 동기 처리, 크면 백그라운드 잡 + 상태조회 엔드포인트. (초기엔 동기로 시작, 추측)
5. 트랜잭션: 행 단위 또는 배치 단위 트랜잭션. 실패 행은 수집해서 리포트.

프론트엔드 작업 (Data Sources 화면):
1. 드래그앤드롭 업로드 + 추론 스키마 미리보기(컬럼/타입).
2. 매핑 편집기: 좌측 컬럼 리스트 ↔ 우측 대상 Object Type 속성 셀렉트로 연결. 링크 규칙 추가 UI.
3. "Ingest" 실행 → 진행/결과 요약 표시(생성 수, 오류 행 테이블).

테스트:
- employees.csv(emp_id, emp_name, company_id) + companies.csv(company_id, company_name) 시드로:
  - Company 먼저 적재 → Person 적재 시 WORKS_AT 링크가 실제로 생성되는지.
  - 재실행 시 중복 노드/링크가 생기지 않는지(멱등성).
- 예외: 매핑에 없는 컬럼, pk 누락 행, 타깃 노드 없음(스텁 생성 옵션 on/off), 타입 변환 실패.

완료 기준(DoD):
- 두 CSV를 업로드·매핑·적재하면 Neo4j 브라우저에서 (:Person)-[:WORKS_AT]->(:Company) 그래프가 보인다.
- 같은 파일 재적재해도 노드/링크 수가 그대로(멱등).

제약: 커밋 금지. 멱등성·예외 테스트를 특히 꼼꼼히.
```

**DoD 확인 포인트**: Neo4j 브라우저에서 그래프 확인, 재적재 멱등성.

---

### Phase 3 — 객체 & 그래프 조회 (Query)

```
목표: 적재된 객체를 검색·조회하고, 링크를 따라 그래프를 탐색하는 조회 API와 UI를 만든다.

전제: Phase 2로 데이터가 적재되어 있음.

백엔드 작업 (app/objects):
1. Object Set 조회: GET /api/objects/{typeApiName}
   - 쿼리 파라미터로 속성 필터(eq/contains), 정렬, 커서/오프셋 페이지네이션.
   - 반환: _rid, title 속성, 요청한 속성들.
2. 단일 객체: GET /api/objects/{typeApiName}/{rid} — 모든 속성 + 링크 타입별 연결 수 요약.
3. 연결 객체: GET /api/objects/{typeApiName}/{rid}/links?linkType=WORKS_AT&direction=OUT
4. 그래프 확장: POST /api/graph/expand
   - body: { startRid, depth(1~3), linkTypes?[] } → 노드/엣지 목록(그래프 뷰 포맷: {nodes:[{id,label,type,title}], edges:[{source,target,type}]}).
   - depth 상한(예: 3)과 노드 수 상한(예: 500)으로 폭발 방지.
5. 전역 검색: POST /api/graph/search — title/주요 속성에 대한 텍스트 검색(여러 Object Type 교차).
   - Cypher는 파라미터 바인딩만 사용(문자열 결합 절대 금지 — 인젝션 방지).

프론트엔드 작업:
1. Object Explorer: Object Type 선택 → 필터 바 + 결과 테이블 + 페이지네이션. 행 클릭 시 상세 패널.
2. 상세 패널: 속성 표 + 링크 타입별 연결 객체 목록(클릭하면 그 객체로 이동).
3. Graph View: 검색/선택한 객체를 시드로 expand 호출, Cytoscape로 렌더. 노드 클릭 시 한 단계 더 확장. 노드 타입별 색/아이콘.

테스트:
- 필터·페이지네이션 정확성, depth 상한/노드 상한 동작, 존재하지 않는 rid 404.
- Cypher 파라미터 바인딩 확인(인젝션 문자열이 그대로 리터럴 취급되는지).

완료 기준(DoD):
- Explorer에서 Person을 이름으로 검색·필터하고, 상세에서 소속 Company로 이동할 수 있다.
- Graph View에서 한 인물에서 시작해 회사·동료로 그래프를 펼칠 수 있다.

제약: 커밋 금지. 조회는 읽기 전용 — 여기서 데이터를 변경하지 말 것.
```

**DoD 확인 포인트**: Explorer 필터/이동, Graph View 확장.

---

### Phase 4 — Action 실행 엔진 (writeback)

```
목표: 정의된 Action Type을 파라미터로 실행해 객체/링크를 안전하게 수정하고 감사 로그를 남긴다.

전제: Phase 1(action_types 정의) + Phase 2(데이터) 완료.

백엔드 작업 (app/actions):
1. 실행 API: POST /api/actions/{actionApiName}/apply, body = { parameters: {...}, actor?: string }
2. 엔진 (engine.py):
   a. action_types.definition 로드.
   b. 파라미터 검증: required, type(objectRid/string/integer/... ), allowed 값. 실패 시 422 + 어떤 파라미터가 왜 틀렸는지.
   c. rules 적용을 Neo4j 단일 트랜잭션에서 수행:
      - setProperty: 대상 객체(_rid=objectParam)의 property 를 valueParam 으로 SET.
      - createLink / deleteLink (정의하면): 두 rid 사이 관계 MERGE/DELETE.
      - 규칙 실행 중 대상 미존재 등 오류 → 전체 롤백.
   d. effects 실행: audit 이면 audit_log(mongo)에 기록. (webhook 등은 향후)
   e. 성공 시 변경된 객체의 최신 상태 반환.
3. 동시성: 같은 객체 동시 수정에 대한 최소 방어(정의된 property의 낙관적 버전 체크는 선택, 추측).

프론트엔드 작업:
1. Object 상세 패널에 "Actions" 섹션: 이 Object Type을 target으로 하는 Action 목록.
2. Action 선택 → 파라미터 폼(정의의 parameters로 자동 생성, allowed면 셀렉트) → 실행 → 결과/에러 표시.
3. 실행 후 상세 패널이 최신 값으로 갱신되게.

테스트:
- happy path: role 변경 Action 실행 → 노드 property 변경 + audit_log 1건.
- 예외: 잘못된 파라미터 타입/allowed 위반(422), 존재하지 않는 targetRid, rule 중간 실패 시 전체 롤백 확인(부분 반영 없어야 함).

완료 기준(DoD):
- UI에서 한 인물의 role을 Action으로 바꾸면 그래프/상세에 반영되고 감사 로그가 쌓인다.
- 검증 실패·롤백이 정확히 동작한다.

제약: 커밋 금지. 트랜잭션 원자성(부분 반영 금지)을 반드시 테스트.
```

**DoD 확인 포인트**: Action 실행 후 값 변경 + 감사 로그, 롤백 케이스.

---

### Phase 5 — 마감: 데모 시드 & 다듬기

```
목표: 처음 보는 사람이 5분 만에 전체 사이클을 체험할 수 있게 데모 데이터와 문서를 정리한다.

작업:
1. docs/ontology-examples/ 에 데모 온톨로지(Person, Company, WORKS_AT, INVESTED_IN) 정의와
   employees.csv / companies.csv / investments.csv 샘플 제공.
2. 시드 스크립트: 온톨로지 정의 생성 → 데이터소스 업로드·매핑·적재까지 한 번에 실행하는
   backend 관리용 스크립트(예: python -m app.scripts.seed_demo).
3. README에 "데모 시드 → Explorer/Graph에서 확인 → role 변경 Action 실행"까지의 워크스루 추가.
4. /health 확장(각 DB 카운트), 프론트 대시보드에 Object Type 수·객체 수·링크 수 요약 카드.

완료 기준(DoD):
- clone → docker compose up → seed_demo → 브라우저에서 그래프 탐색 + Action 실행이 매끄럽게 된다.
```

---

## 10. AGENTS.md 초안 (레포 루트에 별도 저장)

```markdown
# AGENTS.md — fixy-craft

## 프로젝트
fixy-craft: FDE가 반입한 데이터를 온톨로지에 매핑해 Neo4j 그래프로 적재하고,
관리자 웹에서 객체·관계를 탐색/수정하는 소형 팔란티어형 데이터 플랫폼.
스택: FastAPI(백엔드) + Next.js App Router(프론트) + MongoDB(메타) + Neo4j(인스턴스).

## 핵심 개념(용어 고정)
- Object Type: 실세계 엔티티 스키마 → Neo4j 라벨. apiName = PascalCase.
- Property: Object Type 속성 → 노드 프로퍼티. apiName = camelCase.
- Link Type: 두 Object Type 관계 → Neo4j 관계 타입. apiName = SCREAMING_SNAKE_CASE.
- Action Type: 객체/링크 변경 스키마(파라미터+검증+효과).
- Hydration: 데이터소스를 매핑대로 그래프에 upsert 하는 것.

## 아키텍처 규칙
- 메타데이터(정의)는 MongoDB, 인스턴스(객체/링크)는 Neo4j. 이 경계를 섞지 않는다.
- 백엔드 도메인은 ontology / ingestion / objects / actions 4개. 각 도메인은 schemas/service/router 3층.
  레이어를 더 쪼개지 말 것(가독성 우선, 과도한 분리 금지).
- 모든 노드는 공통 라벨 :FxObject + 내부 _rid(UNIQUE) + _typeApiName 을 가진다.

## 코딩 규칙
- Cypher는 반드시 파라미터 바인딩 사용. 쿼리 문자열에 사용자 입력을 결합하지 말 것(인젝션 금지).
- 조회 경로(objects 도메인)는 읽기 전용. 데이터 변경은 ingestion(적재)과 actions(writeback)에서만.
- Action rules는 단일 트랜잭션에서 원자적으로. 부분 반영 금지.
- Pydantic v2, Beanie(ODM) 스타일 준수. MongoDB엔 FK가 없으므로 참조 무결성(존재 검증·삭제 거부)은 service 계층에서 보장. 타입 힌트 필수.

## 작업 규칙 (중요)
- 기능 명세를 바꾸지 말 것. 기존 동작 유지, 요청된 것만 추가.
- 임의로 git commit 하지 말 것. 변경만 남기고 커밋은 사람이 한다.
- 예외/에러 케이스 테스트를 꼼꼼히 작성(happy path만으로 완료 처리 금지).
- 추측이 필요하면 코드 주석/PR 설명에 "(추측)"으로 근거를 남긴다.
- 응답·문서·주석은 한국어로.

## Definition of Done
- 해당 Phase의 DoD 항목을 모두 만족.
- 예외 테스트 통과. `docker compose up`으로 기동 확인.
```

---

## 11. 열린 질문 / 다음 결정

Phase 진행 중 이 사이드 프로젝트에 맞게 정할 것들(현재는 위 (추측)값으로 진행):

1. **인제스트 동기 vs 비동기**: 초기 동기 → 대용량 다룰 때 백그라운드 잡(예: RQ/Arq)로 전환할지.
2. **타깃 노드 없을 때 링크 정책**: 스텁 노드 생성 vs 오류 처리 — 기본값을 무엇으로?
3. **Action의 side effect 확장**: 감사 로그 외 webhook/알림을 언제 도입할지.
4. **권한 모델**: 지금은 관리자 단일 롤. Object/Property 단위 보안을 어느 Phase에서 도입할지.
5. **_rid 체계**: `ri.<type>.<uuid>` 형태로 확정할지, primary key만으로 갈지.
6. **그래프 시각화 라이브러리**: Cytoscape로 확정 vs react-force-graph 비교 후 결정.

> 이 항목들은 Phase 3 이후 실제 데이터를 보며 결정하는 것을 권장.