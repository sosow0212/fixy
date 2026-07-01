---
name: conventional-commits
description: 커밋 메시지를 작성하거나 변경을 커밋할 때. Conventional Commits 규약으로 일관된 메시지를 만든다.
metadata:
  level: "3"
  scope: team
  tags: "git, commit, convention"
  uses: "0"
  source: baseline
  created: "2026-06-17"
---

# Conventional Commits

## 언제 쓰는가
변경을 커밋할 때, 또는 커밋 메시지를 검토/정리할 때.

## 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type**: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore`
- **scope**(선택): 영향 범위 (예: `auth`, `api`, `ui`)
- **subject**: 명령형·소문자 시작·마침표 없음·50자 이내
- **body**(선택): 무엇을·왜 (어떻게는 코드가 말한다). 72자 줄바꿈
- **footer**(선택): `BREAKING CHANGE:` , 이슈 참조 `Closes #123`

## 절차
1. 변경을 논리 단위로 나눈다(한 커밋 = 한 의도). `git add -p` 활용.
2. type 을 고른다 — 동작 변화 없으면 `refactor`/`style`, 버그면 `fix`, 새 기능이면 `feat`.
3. subject 는 "이 커밋이 적용되면 ___ 된다" 형태로.
4. 호환성 깨짐은 footer 에 `BREAKING CHANGE:` 명시.

## 예시
```
feat(auth): add refresh-token rotation

Access 토큰 탈취 영향을 줄이기 위해 refresh 시 토큰을 회전시킨다.
기존 토큰은 사용 즉시 무효화된다.

Closes #214
```

## 하지 말 것
- "fix bug", "update", "wip" 같은 모호한 subject
- 여러 무관한 변경을 한 커밋에 섞기
- 메시지에 시크릿·내부 URL 넣기
