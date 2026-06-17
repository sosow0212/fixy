# 레벨 승급 개선 시스템

fixy 의 자가개선은 **지식 성숙도 레벨(L1~L5)** 위에서 돌아갑니다. 작은 개인 관찰에서 출발해, 증거가 충분히 쌓이면 한 단계씩 위로 **승급(promote)** 되고, 결국 전 팀원이 공유하는 코어가 됩니다.

```
   L1 에피소드 ──(유사한 게 N개)──▶ L2 스킬 ──(M회 재사용)──▶ L3 공통 스킬
        │                                                        │
   개인·로컬                                              (같은 태그 K개)
                                                                 ▼
                                                  L4 팀 규칙 ──(안정화)──▶ L5 코어
                                                   (사람 승인)            (사람 승인)
```

---

## 왜 레벨로 나누는가

학습한 내용을 전부 곧장 "스킬"이나 "규칙"으로 만들면 두 가지 문제가 생깁니다.

1. **신뢰도 구분이 사라진다** — 딱 한 번 우연히 통한 방법과, 열 번 검증된 원칙이 같은 무게로 섞인다.
2. **노이즈가 쌓인다** — 비슷비슷한 스킬이 난립해 무엇을 따라야 할지 알 수 없게 된다.

레벨은 **"증거의 양"으로 신뢰도를 표현**해 이 문제를 푼다. 한 번 관찰한 것은 가볍게(L1), 반복적으로 검증된 것은 무겁게(L5) 다룬다. 낮은 레벨에서 노이즈를 걸러내고, 위로 갈수록 **적고 단단한 공통 지식만** 남긴다. 동시에 범위도 자연스럽게 넓어진다 — L1~L2 는 개인적, L3 부터 팀 공통, L4~L5 는 모두가 따르는 약속이라 사람 승인을 거친다.

---

## 각 레벨 상세

### L1 — 에피소드 (개인 · 자동)

매 작업 한 건을 `{프롬프트, 신호, 태그, 만진 파일}` 으로 기록한 원시 메모리.

- **저장**: `memory/episodes.jsonl` (append-only) — `.gitignore` 라 **공유되지 않음**
- **생성**: `fixy-recorder` 플러그인이 세션 종료(`session.idle`)마다 자동 기록. `fixy_note` 로 직접 핀도 가능
- **신호 종류**:
  - `complaint` — 불만/부정 ("왜 이렇게 안돼", "별로야")
  - `correction` — 교정 요구 ("그게 아니라", "다시", "고쳐")
  - `insight` — 재사용 가능한 깨달음
  - `success` — 잘 동작 / 감사
  - `note` — 일반 작업

> 불만·교정이 반복되는 주제가 가장 값진 학습거리다 — 같은 실수를 막는 게 핵심이기 때문.

**예시 (episodes.jsonl 한 줄):**
```json
{"id":"...","ts":"2026-06-17T...","signal":"correction","summary":"날짜를 한국식 YYYY-MM-DD 로","tags":["date","format","api","response"],"files":["src/order/order.controller.ts"]}
```

### L2 — 스킬 (개인 → 팀)

유사한 L1 이 쌓였을 때 만드는 재사용 가능한 절차/런북.

- **저장**: `.opencode/skills/<name>/SKILL.md`
- **승급 조건**: 유사 L1 이 `minEpisodes`(기본 3)개 이상 + 태그 유사도 `minTagOverlap`(0.34) 이상
- **방법**: `/fixy-evolve` → `fixy_digest`(결정론적 클러스터링)로 후보를 잡고 `fixy_promote` 로 작성. 묶인 L1 들은 "승급됨"으로 표시되어 다시 후보에 오르지 않음
- **공유**: `/fixy-share` → `fixy/skill-*` 브랜치 + 포크 PR

**예시 (SKILL.md):**
```markdown
---
name: api-date-format
description: API 응답에 날짜를 포함할 때. 한국식 YYYY-MM-DD(또는 ISO8601)로 통일한다.
metadata:
  level: "2"
  scope: personal
  tags: "date, format, api, response"
  uses: "0"
---
# API 날짜 포맷
## 언제 쓰는가
응답 DTO/JSON 에 날짜·시각 필드를 넣을 때.
## 절차
1. 날짜는 `YYYY-MM-DD`, 시각 포함은 ISO8601(`YYYY-MM-DDTHH:mm:ssZ`).
2. 로캘 의존 포맷(MM/DD/YYYY) 금지 — 직렬화 시점에 고정.
3. 기존 응답이 다른 포맷이면 그 컨벤션을 우선(레거시 존중).
```

### L3 — 공통 스킬 (팀)

충분히 검증돼 팀이 함께 쓰는 스킬.

- **저장**: `.opencode/skills/` (metadata `scope: team`)
- **승급 조건**: L2 스킬이 `minUses`(기본 5)회 이상 `fixy_recall` 로 재사용됨 (세션당 1회로 집계 — 투기적 호출로 부풀지 않음)
- **방법**: `fixy_levelup <스킬>` (자동, 승인 불필요) → upstream PR 권장

### L4 — 팀 규칙 (팀 · 사람 승인)

한 주제로 모인 L3 스킬들의 공통 원칙을 규칙으로 승격.

- **저장**: `.opencode/rules/team-<주제>.md` (opencode `instructions` 로 주입)
- **승급 조건**: 같은 태그의 L3 가 `minSkills`(기본 3)개 이상
- **방법**: `/fixy-level-up` 이 규칙 초안을 **제안** → 사용자 승인 후에만 작성 → upstream PR
- ⚠️ **자동 적용 금지** — 항상 제안 → 승인 → 적용

### L5 — 코어 헌법 (전 팀원 · 사람 승인)

전 팀원이 따르는 불변 원칙.

- **저장**: `.opencode/rules/core.md` (모든 작업에 `instructions` 로 주입)
- **승급 조건**: L4 규칙이 안정화되어 전 팀원 합의급
- **방법**: `/fixy-level-up` 이 변경 diff 를 **제안** → 명시적 승인 후에만 → upstream PR
- ⚠️ 전 팀원에 영향. 가장 신중하게 다룬다.

---

## 3중 제어 루프

레벨 간 이동은 세 개의 루프가 담당한다. 기계적인 일은 LLM 없이(토큰 0) 처리한다.

| 루프 | 트리거 | 동작 | LLM 사용 |
|---|---|---|---|
| **이너** | 매 세션(`session.idle`) | `fixy-recorder` 가 프롬프트·신호·만진 파일을 L1 에 자동 기록 | 0 (결정론) |
| **아우터** | `/fixy-evolve` | `fixy_digest`(클러스터링) → `fixy_promote`(L1→L2) | 승급 판단·본문 작성만 |
| **메타** | `/fixy-level-up` | L2→L3 자동 / L3→L4→L5 는 제안→승인→적용 | 규칙 초안 작성만 |

---

## 임계치 조정

팀 성향에 맞게 `fixy.config.json > levels` 에서 조정한다.

```json
{
  "levels": {
    "l1ToL2": { "minEpisodes": 3, "minTagOverlap": 0.34 },
    "l2ToL3": { "minUses": 5 },
    "l3ToL4": { "minSkills": 3 },
    "requireHumanApproval": ["l3ToL4", "l4ToL5"]
  }
}
```

- **빨리 학습시키고 싶다** → `minEpisodes`/`minUses` 를 낮춘다 (대신 노이즈 증가)
- **엄선된 스킬만** → 임계치를 높이고 `minTagOverlap` 을 올린다
- **`requireHumanApproval`** — 사람 승인을 강제할 승급 단계. 기본은 규칙·코어(L4/L5)

---

## 안전 원칙

1. **시크릿 스캔** — L2 작성(`fixy_promote`)·모든 공유(`fixy_share`) 전 강제. 발견 시 차단.
2. **사람 승인(HITL)** — L4·L5 는 자동 적용 금지.
3. **개인 기록 비공유** — L1 `episodes.jsonl` 은 공유되지 않는다. 공유되는 건 L2+ 뿐.

---

## 스킬 작성 기준 (좋은 L2 만들기)

- `name`: kebab-case, 소문자 영숫자.
- `description`: **"언제 쓰는지"** 를 1~2문장으로 분명히 (검색·목록에 노출되어 recall 정확도를 좌우).
- 본문: 다음에 그대로 따라 할 수 있을 만큼 구체적인 단계별 절차. 디버깅 런북은 **증상 → 원인 → 해결 → 예방** 형태가 좋다.
- 일회성·레포 고유 맥락은 스킬로 만들지 않는다(노이즈). **재사용 가능성**이 핵심 판단 기준.
