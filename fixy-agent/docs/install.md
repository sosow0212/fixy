# 설치 가이드

## 1. 사전 요구사항

| 도구 | 용도 | 설치 |
|---|---|---|
| **bun** ≥ 1.2 | 플러그인·스크립트 런타임 | `curl -fsSL https://bun.sh/install \| bash` |
| **opencode** ≥ 1.17 | 에이전트 호스트 | 공식 설치 스크립트 또는 `npm i -g opencode-ai` |
| **gh** (GitHub CLI) | 학습물 PR 공유 | `brew install gh` → `gh auth login` |
| **git** | 버전 관리·공유 | (대부분 기본 설치) |
| **ripgrep** (rg) | 코드 검색(권장) | `brew install ripgrep` |

확인:
```bash
bun --version        # 1.2 이상
opencode --version   # 1.17 이상
gh auth status       # Logged in to github.com 표시
```

---

## 2. 설치

```bash
# GitHub 에서 이 레포를 Fork 한 뒤
git clone https://github.com/<나>/fixy-agent.git ~/.fixy-agent
cd ~/.fixy-agent
bash install.sh
```

`install.sh` 가 하는 일:

1. `bun`·`opencode` 존재 확인
2. 에이전트·커맨드·플러그인·스킬을 전역 `~/.config/opencode/{agents,commands,plugins,skills}` 에 **심볼릭 링크**
3. `.opencode` 에서 `bun install` (플러그인 런타임 의존성)
4. `.install-manifest.json` 에 설치내역 기록 (제거 시 정확히 이것만 되돌림)

> **안전 보장**: 사용자의 기존 `opencode.jsonc`·`oh-my-openagent.json`·직접 만든 에이전트는 건드리지 않는다. 같은 이름의 실제 파일/외부 심볼릭 링크가 있으면 **스킵하고 경고**만 낸다 (덮어쓰지 않음).

---

## 3. 공유 저장소 설정 (선택 — PR 공유를 쓸 때만)

학습·기록·스킬화는 설정 없이도 동작한다. **`/fixy-share`(PR 공유)** 만 아래 설정이 필요하다.

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

- `fork` — 내 학습물을 올릴 곳(내 포크). 개인 학습(L2)의 기본 대상
- `upstream` — 팀 공통 코어가 모이는 원본. 팀 공통(L3+)을 올릴 때

그리고 레포에 remote 를 건다(클론했다면 이미 `origin` 이 있다):
```bash
cd ~/.fixy-agent
git remote add origin https://github.com/<나>/fixy-agent.git   # origin = 내 포크
gh auth status                                                 # 인증 확인
```

> 설정 전에는 `/fixy-share` 가 **"repo.fork 가 설정되지 않았습니다"** 로 안전하게 중단한다 — 의도치 않은 레포로 PR 이 나가지 않는다.

---

## 4. 확인

```bash
opencode agent list | grep fixy        # fixy (primary), fixy-reviewer (subagent)

cd ~/projects/아무-프로젝트 && opencode
# TUI 에서:
@fixy 안녕                              # 메인 에이전트 호출
/fixy-status                            # 파이프라인 현황 (기본 스킬 3종이 보이면 정상)
```

> ⚠️ 이미 opencode 가 떠 있었다면 **완전히 종료 후 다시** 켜야 새 에이전트/플러그인이 로드된다.

---

## 5. 환경변수

| 변수 | 효과 |
|---|---|
| `FIXY_HOME` | 학습물·설정 루트 강제 (기본: 레포 위치 자동 역산) |
| `FIXY_RECORD=0` | L1 자동 기록 끔 |
| `FIXY_RECORD_ALL=1` | fixy 외 에이전트 세션도 L1 기록 (기본은 fixy 세션만) |
| `FIXY_AUTOSHARE=1` | 세션 종료 시 자동 공유 켬 (기본 OFF) |
| `FIXY_SKIP_DEPS=1` | 설치 시 의존성 설치 생략 (오프라인/테스트) |
| `FIXY_GLOBAL_DIR` | 전역 디렉토리 경로 변경 (기본 `~/.config/opencode`) |

---

## 6. 업데이트 / 제거

```bash
cd ~/.fixy-agent && bash update.sh      # git pull(가능 시) + 재링크
cd ~/.fixy-agent && bash uninstall.sh   # manifest 의 우리 링크만 제거
```

제거는 우리가 만든 링크만 지운다. 레포 디렉토리와 `memory/`(개인 학습)는 남는다 — 완전 삭제하려면 디렉토리를 직접 지운다.

---

## 7. 문제 해결

**`@fixy` 가 안 보인다**
→ opencode 를 완전히 종료 후 재실행. `opencode agent list | grep fixy` 로 확인. 안 나오면 `bash install.sh` 재실행 후 링크 확인: `ls -l ~/.config/opencode/agents | grep fixy`.

**`fixy_*` 도구가 동작하지 않는다 / 플러그인 로드 실패**
→ `.opencode` 의존성 미설치일 수 있다: `cd ~/.fixy-agent/.opencode && bun install`. opencode 를 `--print-logs --log-level DEBUG` 로 켜 로그 확인.

**`opencode` 가 "Configuration is invalid" 라고 한다 (레포 안에서)**
→ `opencode.json` 에는 opencode 표준 키만 허용된다(주석 키 불가). fixy 의 `opencode.json` 은 이미 표준만 쓴다 — 직접 키를 추가했다면 제거.

**`/fixy-share` 가 PR 을 안 만든다**
→ ① `gh auth status` 인증 확인 ② `fixy.config.json` 의 `repo.fork` 채움 ③ `git remote -v` 로 `origin` 존재 확인. 먼저 `dryRun` 으로 점검: 커맨드가 시크릿 스캔과 대상 파일만 검사한다.

**시크릿 스캔에 막혔다**
→ 스킬/PR 본문에 토큰·키·사내 식별자가 있다는 뜻. 메시지의 `파일:줄 종류` 를 보고 제거 후 재시도. 진짜 예시 값이면 `example`/`placeholder` 같은 단어를 토큰에 포함시키면 통과한다.

**다른 플러그인(oh-my-openagent 등)과 충돌하나?**
→ 아니다. 설치는 추가 링크만 하고 기존 설정을 안 건드린다. 이름이 `fixy-*`/`fixy_*` 라 충돌도 없다.
