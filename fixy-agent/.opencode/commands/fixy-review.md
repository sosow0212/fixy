---
description: 현재 변경(diff)을 독립 검증
agent: fixy-reviewer
---
다음 대상을 검증한다: $ARGUMENTS

현재 변경 사항:
!`git diff --stat HEAD 2>/dev/null | tail -40`

변경된 파일의 diff 를 확인하고, 체크리스트(정확성·레거시 일관성·버그·보안·테스트·단순화)에 따라 심각도별로 간결히 보고한다. 이상 없으면 분명히 "이상 없음"이라고 말한다. 코드는 직접 고치지 않는다.
