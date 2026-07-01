---
description: 학습한 스킬을 포크 저장소에 PR 로 공유
agent: fixy
---
학습물을 팀과 공유한다. 대상 스킬: $ARGUMENTS  (비우면 공유 대기 스킬 전체)

1. `fixy_status` 로 공유 대기(미커밋) 스킬을 확인한다.
2. 먼저 `fixy_share` 를 **dryRun:true** 로 호출해 시크릿 스캔과 대상 파일을 점검한다.
3. 문제 없으면 dryRun 없이 다시 호출해 브랜치+PR 을 생성한다.
   - PR 제목: 무엇을 배웠는지 한 줄. 본문: 왜·언제 쓰는지.
   - 개인 학습(L2)은 기본 target=fork, 팀 공통(L3+)은 target=upstream 을 고려.
4. 생성된 PR 링크를 보고한다.

시크릿이 발견되면 공유하지 말고, 무엇을 제거해야 하는지 알려준다.
