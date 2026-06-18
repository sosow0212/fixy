# fixy-house 설계

> [fixy-agent](../fixy-agent) 가 만들어내는 데이터를 모두 모아 **히스토리·작업 내용**을 추적하고,
> **팀 업무 문서**(Confluence 류) 와 **개인 시크릿 키 보관**(env 류) 까지 한 곳에서 관리하는 운영 공간.
> "fixy 가 일한 흔적 + 팀의 두레박" 이라는 컨셉.

---

## 1. 목적·범위

| 영역 | 무엇 | 데이터 출처 |
|---|---|---|
| **에이전트 세션 히스토리** | fixy-agent 가 보낸 L1 에피소드 / 메시지 / 툴콜 / 메타데이터 | `fixy-agent` HTTP API (Pull/Push) |
| **작업 로그(worklog)** | 위 세션을 사람이 정리한 "이 작업은 무엇" | 사용자/매니저 입력 |
| **팀 업무 문서** | 컨플루언스 류 — 스페이스/페이지(트리) | 사용자 작성 |
| **개인 시크릿** | env 류 — AES-256-GCM 암호화 저장 | 사용자 입력 |
| **팀·멤버·에이전트** | fixy-agent 가 접속할 팀 + 키 발급·회전 | 매니저/사용자 입력 |

---

## 2. 레포 구조

```
fixy-house/
├── backend/      # Spring Boot + Kotlin + MongoDB
├── frontend/     # React + Vite + TS (사용자/팀원용)
├── admin/        # React + Vite + TS (팀 매니저용 — 픽시 에이전트/팀원/초대)
├── docs/         # 설계·운영 문서
└── 작업내용.md    # 진행 로그
```

- **backend**: 단일 Spring Boot 앱. `admin` 과 `frontend` 가 모두 같은 REST API 를 사용한다.
- **admin** 은 "팀 매니저 화면" 만 담당하는 별도 React 앱 (역할 기반 라우팅 X). 같은 backend 를 호출.

---

## 3. 기술 스택 (최신)

### Backend
| | 버전 |
|---|---|
| Kotlin | 2.1.0 |
| Spring Boot | 3.5.x |
| Java | 21 (LTS) |
| Gradle | 8.x (Kotlin DSL) |
| MongoDB (spring-data-mongodb) | latest |
| Spring Security + jjwt 0.12.x | |
| springdoc-openapi | 2.8.x |
| kotlinx-datetime | 0.6.x |
| Kotest + MockK | (test) |

### Frontend
| | |
|---|---|
| React | 19 |
| Vite | 7 |
| TypeScript | 5.7 |
| Tailwind CSS | 4 |
| React Router | 7 |
| TanStack Query | 5 |
| Zustand | 5 (auth/ui state) |
| react-hook-form + zod | |
| shadcn/ui 패턴(직접 컴포넌트) | |

---

## 4. 백엔드 패키지 (DDD, DOKI_BE 컨벤션 그대로)

루트 패키지: `com.fixy.house`

```
com.fixy.house/
├── HouseApplication.kt
├── global/
│   ├── BaseEntity.kt                  # createdAt / updatedAt (Mongo Auditing)
│   ├── config/                        # SecurityConfig, MongoConfig, OpenApiConfig, CorsConfig
│   ├── security/                      # JwtProvider, JwtFilter, @AuthUser, AuthArgumentResolver
│   ├── exceptions/                    # CustomException, CustomExceptionType, GlobalExceptionAdvice
│   └── aop/                           # (필요 시) 트랜잭션/로깅
├── user/                              # [도메인] 일반 사용자
│   ├── ui/
│   │   ├── UserApi.kt                 # Swagger interface
│   │   ├── UserController.kt
│   │   ├── AuthApi.kt                 # /auth/signup, /auth/login
│   │   ├── AuthController.kt
│   │   └── request/                   # SignupRequest, LoginRequest, UpdateProfileRequest
│   ├── application/
│   │   ├── UserService.kt
│   │   ├── AuthService.kt
│   │   ├── LoginFacade.kt
│   │   └── dto/                       # TokenResponse, UserSummaryResponse, ...
│   ├── domain/
│   │   ├── User.kt                    # @Document
│   │   ├── UserRepository.kt          # 인터페이스
│   │   └── vo/                        # Email, Password, UserRole
│   └── infrastructure/
│       ├── UserMongoRepository.kt     # MongoRepository
│       └── UserRepositoryImpl.kt
├── team/                              # [도메인] 팀 + 팀원
├── agent/                             # [도메인] 픽시 에이전트 + key
├── invitation/                        # [도메인] 팀원 초대
├── session/                           # [도메인] 에이전트 세션 + 메시지 + 툴콜
├── worklog/                           # [도메인] 작업 로그
├── document/                          # [도메인] 문서(Space + Page)
└── secret/                            # [도메인] 개인 시크릿
```

> **컨벤션 요약 (DOKI_BE 그대로)**
> - Controller 는 `Api` 인터페이스 implements (Swagger 분리)
> - 인증된 user 는 `@AuthUser userId: String` (String — Mongo ObjectId 사용)
> - Service 는 **도메인 Repository 인터페이스**에만 의존, 인프라(Mongo) 와 분리
> - DTO `companion object { fun from(domain) }` 정적 팩토리
> - 예외: `CustomException(ExceptionType)`, enum 으로 `errorCode/message/httpStatusCode`
> - 메서드/변수명 **축약 금지** — `findUserById`, `updateLastLoginAt` 식으로 풀네임
> - WebFlux/WebClient 사용 안 함 (단순 동기 MVC + RestClient/WebClient 는 필요 시에만)

---

## 5. 도메인 모델 (MongoDB)

### user
```
{ _id: ObjectId, email(unique), passwordHash, displayName, role: USER|ADMIN, lastLoginAt, createdAt, updatedAt }
```

### team
```
{ _id, name, ownerUserId, createdAt, updatedAt }
```

### teamMember
```
{ _id, teamId, userId, role: OWNER|MANAGER|MEMBER, joinedAt, createdAt, updatedAt }
unique index: (teamId, userId)
```

### agent
```
{ _id, teamId, name, status: ACTIVE|DISABLED, agentKeyHash(bcrypt), agentKeyLastFour,
  lastConnectedAt, createdByUserId, createdAt, updatedAt }
```
- **agentKey** 는 발급 시 1회만 평문 노출, 이후는 hash 만 저장.
- `agentKeyLastFour` 는 UI 에서 "마지막 4자리" 표시용.

### invitation
```
{ _id, teamId, invitedEmail, role, tokenHash, status: PENDING|ACCEPTED|REVOKED|EXPIRED,
  invitedByUserId, expiresAt, acceptedAt?, acceptedByUserId?, createdAt, updatedAt }
unique index: (tokenHash)
```

### session
```
{ _id, agentId, teamId, sessionIdFromAgent (e.g. opencode session id),
  userIdOnAgent?, projectName, status: ACTIVE|IDLE|COMPLETED|FAILED,
  startedAt, endedAt?, messageCount, toolCallCount, summary?, createdAt, updatedAt }
unique index: (agentId, sessionIdFromAgent)
```

### message
```
{ _id, sessionId, role: USER|ASSISTANT|SYSTEM|TOOL, content, toolCallId?, sequence, createdAt }
index: (sessionId, sequence)
```

### toolCall
```
{ _id, sessionId, messageId, toolName, argsJson, resultJson?, status: PENDING|SUCCESS|FAILED,
  startedAt, finishedAt?, createdAt }
index: (sessionId)
```

### worklog
```
{ _id, teamId, userId, sessionId?, parentId?, title, description, status: TODO|IN_PROGRESS|DONE|BLOCKED,
  priority: LOW|MEDIUM|HIGH|URGENT, tags: [String], dueDate?, completedAt?, createdAt, updatedAt }
index: (teamId, status), (teamId, userId)
```

### space (문서 공간)
```
{ _id, teamId, name, slug, description?, icon?, orderIndex, createdByUserId, createdAt, updatedAt }
unique index: (teamId, slug)
```

### document (문서 페이지)
```
{ _id, teamId, spaceId, parentId?, title, content (markdown), orderIndex, visibility: TEAM|PRIVATE,
  authorUserId, lastEditorUserId, tags: [String], createdAt, updatedAt }
index: (teamId, spaceId, parentId)
```

### secret (개인 시크릿)
```
{ _id, ownerUserId, key, encryptedValue, iv, authTag, scope: PERSONAL|TEAM, teamId?, description?,
  lastUsedAt?, createdAt, updatedAt }
unique index: (ownerUserId, key, scope)
```
- `encryptedValue` 는 `AES-256-GCM(key=masterKey, iv=random 12B, aad=key:ownerUserId:scope)` 으로 암호화.
- `masterKey` 는 `app.security.master-key` (Base64 32B) — 운영에선 KMS / Vault 권장.

---

## 6. API 표면 (요약)

> 인증: `Authorization: Bearer <accessToken>` (JWT, 30분). 리프레시 14일.
> 에이전트 인증: `X-Fixy-Agent-Key: <rawKey>` (단, 평문은 1회만 노출 — 해시와 비교)

### Auth
- `POST /api/v1/auth/signup` `{email, password, displayName}` → 201 + `TokenResponse`
- `POST /api/v1/auth/login` `{email, password}` → 200 + `TokenResponse`
- `POST /api/v1/auth/refresh` `{refreshToken}` → 200 + `TokenResponse`
- `GET  /api/v1/auth/me` → `UserSummaryResponse`

### Users
- `GET  /api/v1/users/me` · `PATCH /api/v1/users/me` (displayName, password)

### Teams
- `POST /api/v1/teams` `{name}` → 201
- `GET  /api/v1/teams` (내가 속한 팀 목록)
- `GET  /api/v1/teams/{teamId}` · `PATCH` · `DELETE`
- `GET  /api/v1/teams/{teamId}/members` · `PATCH/DELETE` (역할 변경/제외)

### Agents
- `POST /api/v1/teams/{teamId}/agents` `{name}` → 201 + **agentKey 평문(1회만)**
- `GET  /api/v1/teams/{teamId}/agents`
- `POST /api/v1/agents/{agentId}/rotate-key` → 새 키 평문
- `PATCH /api/v1/agents/{agentId}` `{name?, status?}`

### Invitations
- `POST /api/v1/teams/{teamId}/invitations` `{email, role}`
- `GET  /api/v1/teams/{teamId}/invitations`
- `POST /api/v1/invitations/accept` `{token}` (이메일 기반 자동 로그인/가입)
- `DELETE /api/v1/teams/{teamId}/invitations/{invitationId}`

### Agent → Backend (에이전트가 호출)
- `POST /api/v1/agent/sessions` `{sessionId, project, startedAt}` (세션 시작)
- `POST /api/v1/agent/sessions/{sessionId}/messages` `{role, content, sequence, createdAt}`
- `POST /api/v1/agent/sessions/{sessionId}/tool-calls` `{...}`
- `POST /api/v1/agent/sessions/{sessionId}/episodes` `{signal, summary, tags, files, ts}`
- `PATCH /api/v1/agent/sessions/{sessionId}` `{status, endedAt, messageCount, toolCallCount, summary}`

### Sessions (사용자 조회)
- `GET  /api/v1/teams/{teamId}/sessions` (필터: status, agentId, project, 기간)
- `GET  /api/v1/sessions/{sessionId}` (세션 + 메시지/툴콜/에피소드 전체)

### Worklogs
- `GET/POST   /api/v1/teams/{teamId}/worklogs`
- `GET/PATCH/DELETE /api/v1/worklogs/{worklogId}`

### Documents
- `GET/POST   /api/v1/teams/{teamId}/spaces`
- `GET/POST   /api/v1/teams/{teamId}/spaces/{spaceId}/documents`
- `GET/PATCH/DELETE /api/v1/documents/{documentId}`

### Secrets
- `GET/POST   /api/v1/secrets`
- `GET/PATCH/DELETE /api/v1/secrets/{secretId}`
- `GET  /api/v1/secrets/{secretId}/reveal` → 평문 (감사 로그 기록)

### Common
- `GET  /api/v1/health/check` (open)
- Swagger UI: `/swagger-ui.html` (open, dev only)

---

## 7. 시크릿 암호화 (개요)

```
encrypt(plain, ownerUserId, key, scope):
  iv   = random(12)
  aad  = "$key:$ownerUserId:$scope"
  ct   = AES-256-GCM(masterKey, iv, plain, aad) -> (ciphertext, tag)
  store { encryptedValue = ct||tag (Base64), iv = iv (Base64) }

decrypt(record):
  aad = "$record.key:$record.ownerUserId:$record.scope"
  pt  = AES-256-GCM-decrypt(masterKey, record.iv, record.encryptedValue, aad)
```

`masterKey` 는 **반드시** 환경변수/외부 KMS 로 주입. 코드/리포에 평문 금지.

---

## 8. 향후 확장 자리

- 알림(notification) 도메인
- 결제/플랜
- 외부 시스템(github/jira) 동기화
- 검색 전문 검색 (MongoDB Atlas Search / Meilisearch)
- 에이전트 실시간 푸시 (WebSocket)
