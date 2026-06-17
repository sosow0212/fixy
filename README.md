# fixy-agent

> 팀이 함께 키우는 **자가개선형 개발 에이전트** (opencode 기반, TypeScript).

`@fixy` 가 프론트·백엔드·인프라 작업을 직접 수행하고, 받은 **불만·교정을 학습**해 스킬로 영속화한 뒤 **GitHub PR 로 팀과 공유**한다. 지식은 수박게임처럼 작은 개인 관찰(L1)에서 시작해, 쌓이면 팀 공통 규칙(L5)으로 합쳐진다.

## 핵심 아이디어 — 수박게임 레벨

```
 L1 에피소드 ──쌓이면──▶ L2 스킬 ──자주 쓰이면──▶ L3 공통 스킬 ──모이면──▶ L4 규칙 ──▶ L5 코어
   (개인/로컬)            (개인→팀 PR)        (팀)               (사람승인)      (전 팀원)
```

| 레벨 | 무엇 | 어디 | 공유 |
|---|---|---|---|
| **L1** | 매 작업·불만·교정 자동 기록 | `memory/episodes.jsonl` | ❌ 로컬 |
| **L2** | 유사 L1 이 쌓이면 스킬화 | `.opencode/skills/<name>/SKILL.md` | ✅ 포크 PR |
| **L3** | 자주 재사용되면 팀 공통 | `.opencode/skills/` (team) | ✅ PR |
| **L4** | 한 주제로 모이면 규칙 | `.opencode/rules/team-*.md` | ✅ PR + 승인 |
| **L5** | 안정화된 코어 헌법 | `.opencode/rules/core.md` | ✅ PR + 승인 |

자세히: [docs/levels.md](docs/levels.md)

## 설치

```bash
# bun + opencode + gh 가 필요합니다.
git clone <당신의-포크-URL> ~/.fixy-agent
cd ~/.fixy-agent && bash install.sh

# 학습물 공유를 쓰려면:
gh auth login                              # GitHub 인증
# fixy.config.json 의 repo.fork / repo.upstream 을 "owner/name" 으로 채우기
```

설치는 에이전트·커맨드·플러그인·스킬을 전역 `~/.config/opencode` 에 **심볼릭 링크**한다.
기존 opencode 설정(`opencode.jsonc`, oh-my-openagent 등)은 **건드리지 않는다**. 자세히: [docs/install.md](docs/install.md)

## 빠른 시작

```bash
cd ~/projects/my-app
opencode

@fixy 로그인 폼에 이메일 검증 추가해줘        # 신규 기능
@fixy 결제 시 500 에러 나는데 봐줘 [스택]      # 디버깅
/fixy-status                                  # 학습 파이프라인 현황
/fixy-evolve                                  # L1 → L2 스킬 승급
/fixy-share                                   # 학습 스킬 PR 공유
```

`@fixy` 는 작업 전 `fixy_recall` 로 과거 학습을 떠올리고, 불만/교정을 받으면 `fixy_note` 로 기록한다. 기록이 쌓이면 `/fixy-evolve` 가 스킬로 합치고, `/fixy-share` 가 PR 로 팀에 공유한다.

## 커맨드

| 커맨드 | 설명 |
|---|---|
| `/fixy-feature <설명>` | 컨벤션 기반 신규 기능 개발 |
| `/fixy-fix <에러>` | 디버깅 후 런북 기록 |
| `/fixy-review <대상>` | 변경 독립 검증 (`@fixy-reviewer`) |
| `/fixy-evolve` | 아우터 루프: L1 → L2 스킬 승급 |
| `/fixy-level-up <대상>` | 메타 루프: L2→L3, L3→L4/L5 (사람 승인) |
| `/fixy-share [스킬]` | 학습물 포크 PR 공유 |
| `/fixy-status` | 레벨 파이프라인 현황 |

## 구성

- **에이전트**: `fixy`(메인) · `fixy-reviewer`(읽기 전용 검증)
- **네이티브 툴**(토큰 0): `fixy_recall` · `fixy_note` · `fixy_status` · `fixy_digest` · `fixy_promote` · `fixy_levelup` · `fixy_share`
- **플러그인**: `fixy-recorder`(이너 루프 자동 기록) · `fixy-tools`(툴) · `fixy-autoshare`(자동 공유, 기본 OFF)
- **규칙**: `core.md`(L5) · `self-improvement.md`(레벨 규약)
- **기본 스킬**(L3): conventional-commits · systematic-debugging · code-review-checklist

## 문서

- [아키텍처](docs/architecture.md) · [레벨 시스템](docs/levels.md) · [설치](docs/install.md) · [사용법](docs/usage.md)

## 제거 / 업데이트

```bash
cd ~/.fixy-agent && bash update.sh      # 최신화 + 재링크
cd ~/.fixy-agent && bash uninstall.sh   # 우리 링크만 제거(설정은 보존)
```
