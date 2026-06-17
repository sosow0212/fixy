# 아키텍처

## 전체 구조

```
                         사용자 (개발자)
                              │  @fixy  /  /fixy-*
                              ▼
        ┌────────────────────────────────────────────────┐
        │ fixy (메인 에이전트)                              │
        │  recall → 구현 → 검증 → 기록 → 승급/공유          │
        └───────────────┬──────────────────────────────────┘
            검증 위임     │ (생성/검증 분리)
                         ▼
              ┌────────────────────────┐
              │ fixy-reviewer (hidden) │  읽기 전용 독립 검증
              └────────────────────────┘

  ── 자가개선 레이어 (수박게임 L1→L5) ───────────────────────────
   이너 루프(토큰0)        아우터 루프              메타 루프
   fixy-recorder          /fixy-evolve            /fixy-level-up
   chat.message →         fixy_digest(클러스터) →  L2→L3 자동
   session.idle 마다      fixy_promote(L1→L2)     L3→L4→L5 제안(HITL)
   episodes.jsonl append

  ── 저장 ───────────────────────────────────────────────────────
   L1 memory/episodes.jsonl   (개인, gitignore)
   L2/L3 .opencode/skills/    (스킬, PR 공유)
   L4/L5 .opencode/rules/     (규칙·코어, PR + 사람 승인)

  ── 안전 게이트 ─────────────────────────────────────────────────
   시크릿 스캔(공유·승급 전 강제) · HITL(L4/L5) · 개인기록 비공유
```

## 설계 원칙

### 1. 결정론 우선 — LLM 토큰 최소화
기록(`fixy-recorder`)·클러스터링(`levels.clusterEpisodes`)·시크릿 스캔(`secret-scan`)·PR 공유(`github`)는 모두 `lib/` 의 순수 TS 로 동작한다(LLM 호출 0). LLM 은 두 곳에서만 쓴다: **승급 판단 + 스킬 본문 작성**(`/fixy-evolve`), **규칙 초안 제안**(`/fixy-level-up`).

### 2. 생성과 검증의 분리
`fixy` 가 만든 코드는 `fixy-reviewer`(읽기 전용)가 독립 검증한다. 자기 승인 방지.

### 3. 추가만 — 비파괴 설치
설치는 전역 `~/.config/opencode/{agents,commands,plugins,skills}` 에 **심볼릭 링크**를 추가하고 `.install-manifest.json` 에 내역을 남긴다. 제거는 그 내역의 링크만 지운다. 사용자의 `opencode.jsonc`·다른 플러그인은 절대 건드리지 않는다.

### 4. 개인 ↔ 팀 분리
- **개인(L1)**: `episodes.jsonl` 은 `.gitignore`. 로컬에만 남고 공유되지 않는다.
- **팀(L2+)**: 스킬·규칙만 PR 로 공유. 시크릿 스캔을 통과해야 한다.

### 5. 경로 해석 (전역 링크에서도 동작)
플러그인이 `~/.config/opencode/plugins/` 로 심볼릭 링크돼도, bun 은 import 를 **링크의 실제 경로(realpath)** 기준으로 해석한다. 따라서 `../lib/*` 가 레포 내부를 정확히 가리킨다. 데이터 경로(`FIXY_HOME`)는 `lib/paths.ts` 가 자기 파일 위치에서 레포 루트를 역산한다(env `FIXY_HOME` 으로 강제 가능).

## opencode 매핑

| 개념 | opencode 기능 | 파일 |
|---|---|---|
| 메인/서브 에이전트 | file-based agents | `.opencode/agents/*.md` (`mode: primary`/`subagent`) |
| 워크플로 커맨드 | custom commands | `.opencode/commands/*.md` |
| 자동 기록·이벤트 | plugin hooks (`chat.message`, `tool.execute.after`, `event`) | `.opencode/plugins/*.ts` |
| 네이티브 툴 | plugin `tool` hook (zod 스키마) | `fixy-tools.ts` |
| 학습 스킬 | native `skill` 도구 발견 경로 | `.opencode/skills/<name>/SKILL.md` |
| 규칙 주입 | `instructions` (레포 내) / 에이전트 프롬프트(전역) | `.opencode/rules/*.md` |

## 토큰 효율
- 에이전트 2개(메인+검증)로 위임 체인 최소화
- 기록·집계·스캔·공유는 네이티브 코드(토큰 0)
- `fixy_recall` 로 반복 조사·재발 디버깅 비용 제거
