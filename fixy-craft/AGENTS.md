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
