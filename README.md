# fixy-house

fixy-agent 의 작업 데이터를 모두 모아 **히스토리/작업 추적 + 팀 업무 문서(Confluence 류) + 개인 시크릿(env)** 까지 한 곳에서 관리하는 운영 공간.

## 구성

| 경로 | 설명 |
|---|---|
| `backend/` | Spring Boot 3.5.7 + Kotlin 2.0.21 + MongoDB API |
| `frontend/` | React 19 + Vite + TS 사용자/팀원 화면 |
| `admin/` | React 19 + Vite + TS 팀 매니저 화면 |
| `docs/design.md` | 데이터 모델·API 명세·아키텍처 |
| `작업내용.md` | 진행 로그 + 운영 가이드 |

## 빠른 시작

### Backend
```bash
cd backend
./gradlew bootRun
# → http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

`.env` 또는 환경변수:
```bash
MONGODB_URI=mongodb://localhost:27017/fixy_house
JWT_SECRET=<base64 32B 이상>
SECRET_MASTER_KEY=<base64 32B>
```

### Frontend
```bash
cd frontend
bun install        # or npm install
bun run dev        # → http://localhost:5173
```

### Admin
```bash
cd admin
bun install
bun run dev        # → http://localhost:5174
```

## 인증

- **사용자**: `Authorization: Bearer <jwt>` (30분 access + 14일 refresh)
- **에이전트**: `X-Fixy-Agent-Key: <rawKey>` (BCrypt 매칭)

## fixy-agent 연결

`fixy-agent` 가 fixy-house 로 데이터를 보내려면:

1. 매니저가 admin 화면에서 픽시 에이전트를 등록 → `agentKey` 1회 노출 → 환경변수에 저장
2. fixy-agent 가 `X-Fixy-Agent-Key: <key>` 와 함께 `POST /api/v1/agent/sessions` 로 세션 시작
3. 메시지/툴콜/에피소드를 `POST /api/v1/agent/sessions/{sessionIdFromAgent}/...` 로 push
4. 사용자는 frontend 에서 세션/메시지/에피소드를 조회·태깅

자세한 내용: `docs/design.md` §5–§7, `작업내용.md` §7.
