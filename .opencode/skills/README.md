# skills/ — 학습 스킬(L2/L3)

각 스킬은 `<name>/SKILL.md` 한 파일이다. opencode 의 네이티브 `skill` 도구가 이 디렉토리(+`~/.config/opencode/skills`, `.claude/skills`)를 자동 발견한다.

## 프론트매터

```yaml
---
name: kebab-case-name        # 필수, 소문자 영숫자+하이픈
description: 언제 쓰는지 1~2문장   # 필수, 검색·목록에 노출
metadata:                    # 선택, 문자열-문자열 맵
  level: "3"                 # 2=개인 스킬, 3=팀 공통, ...
  scope: team                # personal | team
  tags: "git, commit"
  uses: "0"                  # 재사용 횟수(L3 승급 신호)
  source: baseline           # baseline | fixy-promote | fixy-evolve
  created: "2026-06-17"
---
```

## 두 종류

- **baseline** (`source: baseline`, L3) — 처음부터 함께 배포되는 개발자 공통 스킬. git 추적 중이라 자동 공유 대상이 아니다.
- **learned** (`source: fixy-*`, L2~) — fixy 가 작업하며 익힌 스킬. `/fixy-evolve` 로 생성되고 `/fixy-share` 로 PR 공유된다.

## 작성 원칙

재사용 가능한 **단계별 절차/런북**으로 쓴다. "언제 쓰는지"를 description 에 분명히. 일회성·레포 고유 맥락은 스킬로 만들지 않는다.
