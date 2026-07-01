# fixy-house / admin

팀 매니저 화면 — 팀 / 멤버 / 초대 / 픽시 에이전트를 관리한다.
관리자/매니저 권한이 있는 사용자만 의미 있는 작업을 할 수 있어요.

## 빠른 시작

```bash
bun install
bun run dev   # http://localhost:5174
```

백엔드 주소는 `VITE_API_BASE_URL` 로 지정 (기본 `http://localhost:8080/api/v1`).
Vite dev 서버는 `/api/*` 를 백엔드로 프록시한다.

```bash
cp .env.example .env
```

## 빌드

```bash
bun run build
bun run preview
bun run typecheck
```

## 화면

- `/login` — 매니저 계정 로그인 (JWT)
- `/dashboard` — 운영 콘솔
- `/teams` — 내가 관리하는 팀
- `/teams/:teamId` — 팀 상세 (멤버 + 초대)
- `/invitations` — 초대 토큰 발급/취소
- `/agents` — 픽시 에이전트 등록 / 키 회전
- `/members` — 멤버 권한 / 제거
- `/audit/secrets` — 시크릿 reveal 감사 로그 (예정)

## 백엔드

`../backend` (Spring Boot). 같은 REST API 를 사용 — 자세한 내용은 `../docs/design.md` §6.
