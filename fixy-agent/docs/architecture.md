# 아키텍처

## 전체 구조

```
                              사용자 (개발자)
                                   │  @fixy  또는  /fixy-*
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │ fixy (메인 에이전트)                                    │
        │   recall → 구현 → 검증 → 기록 → 승급/공유               │
        └───────────────┬──────────────────────────────────────┘
                        │ task (M 이상 규모에서 검증 위임)
                        ▼
              ┌────────────────────────┐
              │ fixy-reviewer (hidden) │   읽기 전용 독립 검증 (생성/검증 분리)
              └────────────────────────┘

  ── 자가개선 레이어 (레벨 승급 L1→L5) ─────────────────────────────────
   이너 루프 (토큰 0)         아우터 루프                메타 루프
   fixy-recorder            /fixy-evolve              /fixy-level-up
   chat.message →           fixy_digest(클러스터링)→   L2→L3 자동
   session.idle 마다        fixy_promote(L1→L2)       L3→L4→L5 제안 (HITL)
   episodes.jsonl 기록

  ── 저장 ──────────────────────────────────────────────────────────────
   L1  memory/episodes.jsonl    (개인 · gitignore)
   L2/L3  .opencode/skills/     (스킬 · PR 공유)
   L4/L5  .opencode/rules/      (규칙·코어 · PR + 사람 승인)

  ── 안전 게이트 ────────────────────────────────────────────────────────
   시크릿 스캔(공유·승급 전 강제) · HITL(L4/L5) · 개인기록 비공유
```

---

## 디렉토리 레이아웃

```
fixy-agent/                     (= ~/.fixy-agent 설치 시)
├── .opencode/
│   ├── agents/                 fixy.md(메인) · fixy-reviewer.md(검증)
│   ├── commands/               /fixy-* 커맨드 7종
│   ├── plugins/                fixy-recorder · fixy-tools · fixy-autoshare
│   ├── skills/                 L2/L3 스킬 (baseline 3종 + 학습물)
│   ├── rules/                  core.md(L5) · self-improvement.md · team-*.md(L4)
│   └── lib/                    플러그인 공용 TS (아래 표)
├── scripts/                    install.ts · uninstall.ts · lib/common.ts
├── memory/                     L1 에피소드(런타임 · gitignore)
├── docs/                       architecture · levels · install · usage
├── fixy.config.json            팀 설정(포크/업스트림, 레벨 임계치)
└── install.sh / uninstall.sh / update.sh
```

### `.opencode/lib/` — 결정론 코어

LLM 없이 동작하는 순수 TypeScript. 플러그인·툴·스크립트가 공유한다.

| 모듈 | 책임 |
|---|---|
| `paths.ts` | `FIXY_HOME`·설정 해석 (SSOT). 파일 위치에서 레포 루트를 역산 |
| `text.ts` | 신호 판정(`detectSignal`)·태그 추출·유사도(`jaccard`) |
| `episodes.ts` | L1 저장소(JSONL append/read/회전, 원자적 쓰기) |
| `levels.ts` | 레벨 엔진 — 클러스터링·스킬 CRUD·승급·파이프라인 현황 |
| `frontmatter.ts` | SKILL.md YAML 프론트매터 무손실 읽기/쓰기 |
| `secret-scan.ts` | 시크릿 스캐너 — 공유/승급 전 안전 게이트 |
| `github.ts` | `gh` CLI 래퍼 — 브랜치·커밋·PR |

---

## 설계 원칙

### 1. 결정론 우선 — LLM 토큰 최소화
기록·클러스터링·시크릿 스캔·PR 공유는 모두 `lib/` 의 순수 TS 로 동작한다(LLM 호출 0). LLM 은 두 곳에서만 쓴다: **승급 판단 + 스킬 본문 작성**(`/fixy-evolve`), **규칙 초안 제안**(`/fixy-level-up`).

### 2. 생성과 검증의 분리
`fixy` 가 만든 코드는 `fixy-reviewer`(읽기 전용)가 독립 검증한다. 자기 코드를 자기가 승인하지 않는다. Critical/High 지적은 `fixy` 가 직접 고치고 1회 재검증.

### 3. 추가만 — 비파괴 설치
설치는 전역 `~/.config/opencode/{agents,commands,plugins,skills}` 에 **심볼릭 링크**를 추가하고 `.install-manifest.json` 에 내역을 남긴다. 제거는 그 내역의, 우리 레포를 가리키는 링크만 지운다. 사용자의 `opencode.jsonc`·다른 플러그인은 절대 건드리지 않는다. 같은 이름의 사용자 실제 파일/외부 링크가 있으면 건드리지 않고 경고만 낸다.

### 4. 개인 ↔ 팀 분리
- **개인(L1)**: `episodes.jsonl` 은 `.gitignore`. 로컬에만 남는다.
- **팀(L2+)**: 스킬·규칙만 PR 로 공유. 시크릿 스캔을 통과해야 한다.

### 5. 경로 해석 — 전역 링크에서도 정확
플러그인이 `~/.config/opencode/plugins/` 로 심볼릭 링크돼도, bun 은 import 를 **링크의 실제 경로(realpath)** 기준으로 해석한다. 따라서 `../lib/*` 가 레포 내부를 정확히 가리킨다. 데이터 경로(`FIXY_HOME`)는 `lib/paths.ts` 가 자기 파일 위치에서 레포 루트를 역산한다(env `FIXY_HOME` 으로 강제 가능).

### 6. 레거시 존중
대상 프로젝트는 그 프로젝트의 기존 구조·컨벤션·스타일을 우선 따른다. 일반 베스트프랙티스는 신규/빈 프로젝트에만 적용.

---

## opencode 매핑

| 개념 | opencode 기능 | 위치 |
|---|---|---|
| 메인/서브 에이전트 | file-based agents (`mode: primary`/`subagent`) | `.opencode/agents/*.md` |
| 워크플로 커맨드 | custom commands (`$ARGUMENTS`, `` !`cmd` ``) | `.opencode/commands/*.md` |
| 자동 기록·이벤트 | plugin hooks: `chat.message`·`tool.execute.after`·`event` | `.opencode/plugins/*.ts` |
| 네이티브 툴 | plugin `tool` hook (zod 스키마) | `fixy-tools.ts` |
| 학습 스킬 | native `skill` 도구 발견 경로 | `.opencode/skills/<name>/SKILL.md` |
| 규칙 주입 | `instructions` (레포 내) / 에이전트 프롬프트(전역) | `.opencode/rules/*.md` |

> 전역 설치에서 코어 규칙은 에이전트 프롬프트(`agents/fixy.md`)가 직접 담는다 — 전역 `instructions` 로 다른 프로젝트/에이전트를 오염시키지 않기 위함. 상세 규칙은 에이전트가 필요 시 `rules/` 를 Read.

---

## 데이터 흐름

### 기록 (이너 루프)
```
chat.message ──▶ detectSignal + extractTags + redact(시크릿)
                 (세션별 pending 에 보관)
tool.execute.after ──▶ edit/write 한 파일 경로 누적
session.idle ──▶ pending → episodes.jsonl 에 1건 append
```
> 전역 플러그인이라 기본은 **fixy 계열 에이전트 세션만** 기록한다(다른 에이전트 오염 방지). 전체 기록은 `FIXY_RECORD_ALL=1`.

### 승급 (아우터 루프)
```
fixy_digest ──▶ 미승급 L1 을 태그 유사도로 단일연결 클러스터링
            ──▶ minEpisodes·minTagOverlap 충족 클러스터 = 승급 후보
fixy_promote ──▶ 시크릿 스캔 → SKILL.md 작성(L2) → L1 들 "승급됨" 표시
```

### 공유
```
fixy_share ──▶ origin·공유대상 가드 → 시크릿 스캔 → 브랜치 → 커밋 → push(origin)
           ──▶ gh pr create (--repo·--head 명시; upstream 은 <fork-owner>:<branch>)
```

---

## 토큰 효율

- 에이전트 2개(메인+검증)로 위임 체인 최소화 — S 등급은 `fixy` 단독, M 이상만 reviewer 1회
- 기록·집계·스캔·공유는 네이티브 코드(토큰 0)
- `fixy_recall` 로 반복 조사·재발 디버깅 비용 제거 — 한 번 배운 건 다시 추론하지 않음
