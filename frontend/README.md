# fixy-house / frontend

사용자/팀원 화면. fixy-agent 가 만들어낸 세션 히스토리, 작업 로그, 팀 문서, 개인 시크릿을 조회·관리한다.

## 빠른 시작

```bash
bun install   # or npm install
bun run dev   # http://localhost:5173
```

`VITE_API_BASE_URL` 로 백엔드 주소를 지정한다 (기본: `http://localhost:8080/api/v1`).
Vite dev 서버는 `/api/*` 를 백엔드로 프록시한다.

```bash
cp .env.example .env
```

## 빌드

```bash
bun run build       # → dist/
bun run preview     # 로컬 프리뷰
bun run typecheck
```

## 라우트

- `/login`, `/signup`
- `/invitations/accept?token=...&email=...`
- `/dashboard`
- `/teams`, `/teams/:teamId`
- `/teams/:teamId/sessions`, `/sessions/:sessionId`
- `/teams/:teamId/worklogs`
- `/teams/:teamId/spaces`, `/spaces/:spaceId`, `/pages/:pageId`
- `/secrets`
- `/profile`

## 백엔드

`../backend` (Spring Boot). 같은 REST API 를 사용한다 — 자세한 내용은 `../docs/design.md` §6.
