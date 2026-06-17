# 사용법

## 기본 — 그냥 일을 시킨다

```
@fixy 사용자 프로필 수정 API 만들어줘
@fixy 이 컴포넌트 리렌더 너무 많이 되는데 최적화해줘
@fixy 결제 콜백에서 가끔 중복 처리돼 [로그]
```

`@fixy` 는 작업 전 `fixy_recall` 로 과거 학습을 떠올리고, 기존 코드 컨벤션을 따라 구현한 뒤, 규모가 크면 `@fixy-reviewer` 로 검증한다.

## 불만·교정이 학습이 되는 흐름

```
1. @fixy 날짜 포맷 YYYY-MM-DD 로 해줘
2. (fixy 가 MM/DD/YYYY 로 함)
3. @fixy 아니 그게 아니라 한국식 YYYY-MM-DD 라니까   ← 'correction' 신호로 L1 자동 기록
4. (fixy 가 고침 + fixy_note 로 교훈 핀)
   ...같은 류 교정이 3번 쌓이면...
5. /fixy-evolve   → "date-format-convention" L2 스킬 생성
6. /fixy-share    → 포크에 PR. 팀원들도 이 스킬을 받게 됨
   ...이 스킬이 5번 재사용되면...
7. /fixy-level-up date-format-convention   → L3 팀 공통 승급
```

## 명령 레퍼런스

| 명령 | 언제 |
|---|---|
| `@fixy <요청>` | 일반 개발 작업 |
| `/fixy-feature <설명>` | 신규 기능(컨벤션 준수 + 검증) |
| `/fixy-fix <에러>` | 디버깅 + 런북 기록 |
| `/fixy-review <대상>` | 변경 독립 검증 |
| `/fixy-status` | 지금 어디까지 학습됐나 |
| `/fixy-evolve` | 쌓인 L1 을 L2 스킬로 |
| `/fixy-level-up [대상]` | L2→L3, L3→L4/L5 (승인) |
| `/fixy-share [스킬]` | 학습물 PR 공유 |

## 툴을 직접 부르고 싶을 때

```
fixy_recall query="jwt 갱신"          # 관련 스킬 검색
fixy_note signal=insight summary="..." # 수동 기록
fixy_status                            # 파이프라인
fixy_digest                            # L2 후보 클러스터
```

## 자동 공유(선택)

기본은 수동(`/fixy-share`). 세션 종료 시 자동 PR 을 원하면:

```bash
export FIXY_AUTOSHARE=1
# 또는 fixy.config.json 의 share.autoOnIdle = true
```

`minLevelToShare`(기본 2) 이상, 미커밋 스킬만, 시크릿 스캔 통과 시에만, 디바운스(90초) 적용해 보수적으로 PR 한다.

## FAQ

**Q. 내 개인 기록(L1)이 팀에 새나가나?**
아니다. `memory/episodes.jsonl` 은 `.gitignore` 라 공유되지 않는다. 공유는 L2+ 스킬·규칙뿐이며, 매번 시크릿 스캔을 거친다.

**Q. 스킬이 너무 많아지면?**
레벨이 자연스러운 필터다. 자주 안 쓰이는 L2 는 L3 로 못 올라가고, `/fixy-status` 로 노이즈를 확인해 정리할 수 있다.

**Q. 모델은?**
에이전트는 모델을 고정하지 않아 각자 opencode 기본 모델을 쓴다(팀 이식성). `agents/fixy.md` 의 `model:` 로 고정 가능.

**Q. 다른 opencode 플러그인(oh-my-openagent 등)과 충돌?**
아니다. 설치는 추가 링크만 하고 기존 설정을 안 건드린다. 이름이 `fixy-*` 라 충돌도 없다.
