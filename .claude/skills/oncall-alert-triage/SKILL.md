---
name: oncall-alert-triage
description: PostHog 에러 트래킹 웹훅(단건 alert + 급증 alert)이 repository_dispatch로 깨운 CI 잡에서, 노이즈(일시적·단발·봇)와 신호(새 에러·여러 유저·급증·핵심 경로)를 판정하는 prod 알림 1차 방어선 스킬. .github/workflows/oncall-alert-triage.yml이 repository_dispatch(type: posthog-alert)를 감지했을 때만 호출한다 — 사람의 채팅 요청이 아니라 PostHog 알림 자체가 트리거다. 노이즈면 CI 로그에 판정 근거만 남기고 종료하고, 신호면 무슨 에러/언제부터/몇 명/의심 원인(최근 커밋 overlap)/영향 범위/권장 액션을 담은 GitHub Issue를 열되 같은 근본 원인이면 dedup해 코멘트로 합친다. DB는 절대 건드리지 않는다(자격 증명 자체가 전달되지 않는다) — prod 직접 수정은 이 스킬의 권한 밖이다.
---

# oncall-alert-triage: prod alert 1차 방어선

목표는 "모든 알림에 사람을 깨우는 것"도 "조용히 다 넘기는 것"도 아니라, **판정 근거를 남기고 애매하면 사람 쪽으로 기우는 것**이다.

## 0. 안전 경계 (절대 어기지 않는다)

- **이 워크플로우에는 Supabase 자격 증명이 전달되지 않는다.** DB를 조회·수정할 수단 자체가 없다 — "read_only"를 규율이 아니라 자격 증명 부재로 강제한다. 영향 범위 판단은 PostHog 데이터(발생 건수·distinct user 수)와 코드베이스(Read/Grep)만으로 한다.
- **코드를 수정하거나 커밋·push하지 않는다.** 이 스킬의 유일한 산출물은 CI 로그(노이즈일 때)와 GitHub Issue(신호일 때)다. `oncall-fix`(CI 실패 자동 수정)와 역할이 다르다 — 이 스킬은 아무것도 고치지 않는다.
- **PostHog 원본 데이터를 그대로 인용하지 않는다.** 스택트레이스·에러 메시지는 필요한 부분만 요약해 Issue에 옮긴다. 유저 이메일 등 PII로 보이는 값이 섞여 있으면 마스킹한다.
- Issue 본문·코멘트에 시크릿으로 보이는 문자열을 원문 인용하지 않는다(`oncall-fix`와 동일 기준).
- 확신이 없을 때는 조용히 넘기지 않는다 — 경계선 판정은 신호 쪽으로 기울이되 `confidence: low`로 명시한다(6번).

## 1. 입력 파싱

호출 프롬프트에 담긴 값을 확인한다: `event_id`, `alert_kind`(`issue` 또는 `spike`), `issue_id` 또는 `alert_id`, `title`, `url`, `occurred_at`.

`event_id`는 웹훅 배달 단위 멱등 키이고, 이번 알림의 "근본 원인 정체성"은 `issue_id`(단건) 또는 `alert_id`(급증)다. 4번 dedup은 후자를 쓴다.

## 2. 근거 수집

### 2-1. PostHog

`POSTHOG_PERSONAL_API_KEY`(Bearer)로 PostHog REST API를 조회한다. `POSTHOG_PROJECT_ID` 환경변수가 project id다. 정확한 엔드포인트 스펙이 확실치 않으면 짐작해서 curl을 반복 시도하지 말고, `WebFetch`로 `https://posthog.com/docs/api/error-tracking`(또는 관련 페이지)를 먼저 확인한다.

확인할 것:
- **단건(`issue`)**: 해당 issue의 최초 발생 시각(first_seen), 총 발생 건수, distinct user 수, 최근 발생 시각, 대표 스택트레이스 상위 프레임(파일 경로), 영향받은 `$current_url`/route.
- **급증(`spike`)**: alert가 걸린 insight의 기준값과 실제값(임계치를 얼마나 넘었는지), 급증 시작 시각, 급증 구간의 에러 유형 분포.

조회에 실패하거나 값을 못 채우면 Issue에 "PostHog 근거: 확인 불가(원인)"로 명시한다 — 있었을 거라고 추정하지 않는다.

### 2-2. 코드베이스 · 최근 커밋

- `git log --oneline --since="<first_seen 기준 24~48시간 전>"`으로 의심 가는 커밋을 찾는다. 스택트레이스에 파일 경로가 있으면 `git log --oneline -- <path>`로 좁힌다.
- 영향받은 route/파일을 `Read`/`Grep`으로 열어 실제로 무엇이 있는지 확인한다. 로그 메시지만 보고 추측하지 않는다.
- `docs/ARCHITECTURE.md`의 핵심 경로와 대조한다: 업로드(`/api/statements`), 분류(`/api/statements/:id/classify`), 인사이트(`/api/insights`), 결제(`/api/checkout`, `/api/webhooks/polar`)가 핵심 경로다. 나머지(정적 페이지 등)는 핵심 경로가 아니다.

## 3. 노이즈 판정 기준 (모두 충족해야 노이즈)

- 새 에러 타입이 아니다 — 동일 `issue_id`가 이전에도 발생했고 이미 알려진/처리 중인 것으로 보인다(과거 dedup 이슈가 열려 있었다면 4번에서 확인).
- distinct user 수가 1명이거나, User-Agent/속성상 봇·크롤러로 보인다.
- 핵심 경로가 아니다.
- 급증(`spike`)이 아니라 단발성이다(짧은 시간에 재발하지 않음).

## 4. 신호 판정 기준 (하나라도 해당하면 신호)

- 새로운 `issue_id`(과거에 본 적 없는 에러).
- distinct user 수가 2명 이상, 또는 알 수 없음(확인 불가 자체가 리스크이므로 신호 쪽으로 기운다).
- 핵심 경로(업로드/분류/인사이트/결제)에서 발생.
- `alert_kind: spike`(급증 alert 자체가 이미 임계치 판정을 통과한 신호).
- 위 노이즈 기준 중 하나라도 확인이 안 되거나 애매하면 신호로 처리하고 `confidence: low`를 명시한다.

## 5. dedup

이슈 본문에 숨긴 마커로 근본 원인 단위 dedup을 한다: `<!-- oncall-alert-dedup: posthog:<issue|alert>:<issue_id 또는 alert_id> -->`

```
gh issue list --repo javiow/finsight --state open --search "posthog:<issue|alert>:<id> in:body"
```

- 열려 있는 이슈가 있으면 **새 이슈를 만들지 않는다**. 대신 `gh issue comment <number> --body-file <scratch>`로 이번 발생 정보(발생 시각, 누적 건수, 새로 확인된 내용)만 추가한다.
- 열려 있는 이슈가 없으면(과거에 닫힌 이슈는 있어도 무방 — 재발은 새 이슈로 취급한다) 6번대로 새로 연다.

## 6. 산출물

### 노이즈 — 기록만 남기고 종료

GitHub Issue를 만들지 않는다. CI 로그(stdout)에 아래 형식으로 판정 근거를 남기고 정상 종료한다. Actions 실행 로그 자체가 기록이다.

```
=== oncall-alert-triage: NOISE ===
event_id: <event_id>
근거: <3번 기준 중 무엇을 충족했는지, 확인한 수치>
===
```

### 신호 — GitHub Issue

스크래치 파일에 본문을 먼저 작성한 뒤 `--body-file`로 넘긴다(따옴표 이스케이프 방지).

```markdown
<!-- oncall-alert-dedup: posthog:<issue|alert>:<id> -->

## 무슨 에러
<에러 타입/메시지 요약, PostHog 링크: <url>>

## 언제부터
<first_seen, 이번 alert 발생 시각(occurred_at)>

## 몇 명
<distinct user 수, 확인 불가면 "확인 불가">

## 의심 원인
<최근 커밋과의 overlap. 겹치는 커밋이 있으면 커밋 해시·요약. 없으면 "최근 커밋과 겹치는 부분 없음 — 배포 외 원인(외부 서비스 장애 등) 가능성">

## 영향 범위
<핵심 경로 여부, 관련 route/기능>

## 권장 액션
<사람이 다음에 할 일 — 예: "커밋 <sha> revert 검토", "Anthropic/Polar 외부 서비스 상태 확인", "재현 스텝: ...">

## confidence
<low | medium | high> — <왜 이 확신도인지 한 줄>

---
이 이슈는 PostHog alert를 감지한 온콜 트리아지 에이전트가 자동으로 생성했습니다. prod 코드나 DB를 직접 수정하지 않았습니다.
```

```
gh issue create --repo javiow/finsight \
  --title "[oncall-alert] <짧은 요약>" \
  --body-file <scratch-path>
```
