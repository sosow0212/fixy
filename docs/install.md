# 설치 가이드

## 사전 요구사항

- **bun** ≥ 1.2 — `curl -fsSL https://bun.sh/install | bash`
- **opencode** ≥ 1.17 — 공식 설치 스크립트 또는 `npm i -g opencode-ai`
- **gh** (GitHub CLI) — 학습물 PR 공유에 필요. `gh auth login` 으로 인증.
- **git**, **ripgrep**(rg) 권장

## 1. 포크 → 클론 → 설치

```bash
# GitHub 에서 이 레포를 Fork 한 뒤
git clone https://github.com/<나>/fixy-agent.git ~/.fixy-agent
cd ~/.fixy-agent
bash install.sh
```

`install.sh` 가 하는 일:
1. 전역 `~/.config/opencode/{agents,commands,plugins,skills}` 에 fixy 파일들을 **심볼릭 링크**
2. `.opencode` 에서 `bun install` (플러그인 의존성)
3. `.install-manifest.json` 에 설치내역 기록

> **안전**: 사용자의 기존 `opencode.jsonc`·`oh-my-openagent.json`·직접 만든 에이전트는 건드리지 않는다. 이름이 같은 '실제 파일'이 있으면 스킵하고 경고만 낸다.

## 2. 공유 저장소 설정

`fixy.config.json` 을 연다:

```json
{
  "repo": {
    "fork": "<나>/fixy-agent",
    "upstream": "<팀>/fixy-agent",
    "defaultBranch": "main",
    "branchPrefix": "fixy"
  }
}
```

- `fork`: 내 학습물을 올릴 곳(내 포크)
- `upstream`: 팀 공통 코어가 모이는 원본

학습물 공유(`/fixy-share`)를 쓰려면 이 레포가 git + remote 여야 한다:

```bash
cd ~/.fixy-agent
git init                                   # (clone 했으면 이미 git)
git remote add origin https://github.com/<나>/fixy-agent.git
gh auth status                             # 안 돼 있으면 gh auth login
```

## 3. 확인

```bash
cd ~/projects/아무-프로젝트
opencode
# TUI 에서:
@fixy 안녕                    # 메인 에이전트 호출
/fixy-status                  # 파이프라인 현황
```

> ⚠️ 이미 opencode 가 떠 있었다면 **완전히 종료 후 다시** 켜야 새 에이전트/플러그인이 로드된다.

## 환경변수

| 변수 | 효과 |
|---|---|
| `FIXY_HOME` | 학습물·설정 루트 강제(기본: 레포 위치 자동 역산) |
| `FIXY_RECORD=0` | L1 자동 기록 끔 |
| `FIXY_RECORD_ALL=1` | fixy 외 에이전트 세션도 L1 기록(기본은 fixy 세션만) |
| `FIXY_AUTOSHARE=1` | session.idle 자동 공유 켬(기본 OFF) |
| `FIXY_SKIP_DEPS=1` | 설치 시 의존성 설치 생략 |
| `FIXY_GLOBAL_DIR` | 전역 디렉토리 경로 변경(기본 `~/.config/opencode`) |

## 업데이트 / 제거

```bash
cd ~/.fixy-agent && bash update.sh      # git pull + 재링크
cd ~/.fixy-agent && bash uninstall.sh   # manifest 의 우리 링크만 제거
```

제거는 우리가 만든 링크만 지운다. 레포 디렉토리와 `memory/`(개인 학습)는 남는다 — 완전 삭제하려면 디렉토리를 직접 지운다.
