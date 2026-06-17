# fixy-agent — 레포 작업 개요

이 파일은 **fixy-agent 레포 자체**를 손볼 때의 개요다. (사용자용 안내는 [README.md](README.md))
컨벤션·동작의 단일 출처(SSOT)는 [`.opencode/rules/`](.opencode/rules/) 이며, opencode `instructions` 로 자동 주입된다.

## 무엇인가

opencode 기반 자가개선형 개발 에이전트. `@fixy` 가 개발을 수행하고, 사용자 피드백을 **수박게임식 레벨(L1→L5)** 로 학습해 GitHub PR 로 팀과 공유한다.

## 디렉토리

```
.opencode/
  agents/      fixy.md(메인) · fixy-reviewer.md(검증)
  commands/    /fixy-* 커맨드 7종
  plugins/     fixy-recorder(이너루프) · fixy-tools(툴) · fixy-autoshare
  skills/      L2/L3 스킬 (baseline 3종 + 학습물)
  rules/       core.md(L5) · self-improvement.md(레벨규약)
  lib/         플러그인 공용 TS (paths/text/episodes/levels/frontmatter/secret-scan/github)
scripts/       install.ts · uninstall.ts · lib/common.ts
memory/        L1 에피소드(런타임, gitignore)
docs/          architecture · levels · install · usage
fixy.config.json   팀 설정(포크/업스트림, 레벨 임계치)
```

## 레벨 시스템 (핵심)

| 레벨 | 저장 | 진입 | 구현 |
|---|---|---|---|
| L1 에피소드 | `memory/episodes.jsonl` | 자동(session.idle) | `fixy-recorder` 플러그인 |
| L2 스킬 | `skills/<name>/SKILL.md` | 유사 L1 누적 | `fixy_digest`→`fixy_promote` |
| L3 공통 | `skills/` (team) | 재사용 누적 | `fixy_levelup` |
| L4 규칙 | `rules/team-*.md` | 같은 태그 L3 누적 | `/fixy-level-up` (HITL) |
| L5 코어 | `rules/core.md` | 안정화 | `/fixy-level-up` (HITL) |

3중 루프: **이너**(매 세션 자동 기록) · **아우터**(`/fixy-evolve`, L1→L2) · **메타**(`/fixy-level-up`, 규칙·코어 개정 제안).

## 설계 원칙

1. **결정론 우선, LLM 최소** — 기록·클러스터링·시크릿 스캔·공유는 `lib/` 의 토큰 0 코드. LLM 은 승급 판단·스킬 본문 작성에만.
2. **추가만, 비파괴** — 설치는 심볼릭 링크 + manifest. 사용자 기존 설정 불변.
3. **안전 게이트** — 공유 전 시크릿 스캔 강제, L4/L5 는 사람 승인.
4. **개인↔팀 분리** — L1 은 로컬(gitignore), L2+ 만 PR 공유.
5. **레거시 존중** — 대상 프로젝트의 기존 구조·컨벤션을 우선.

## 개발

```bash
cd .opencode && bun install     # 플러그인 의존성
bun run typecheck               # 타입 체크(루트에서)
FIXY_SKIP_DEPS=1 bash install.sh   # 로컬 재링크
```

플러그인은 전역으로 심볼릭 링크돼도 bun 이 realpath 로 import 를 해석하므로 `../lib/*` 가 올바르게 잡힌다. 데이터 경로는 `lib/paths.ts` 의 `FIXY_HOME`(파일 위치에서 역산, env 로 override) 기준.

## 기술 스택

opencode 1.17+ · bun · TypeScript · `@opencode-ai/plugin` 1.17.7 (zod 4) · GitHub `gh` CLI.
