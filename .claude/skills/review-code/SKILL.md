---
name: review-code
description: FinSight 변경사항을 3개의 전문화된 서브에이전트(정확성/아키텍처·CRITICAL 준수/테스트 품질)로 병렬 심층 리뷰하고, critical/major/minor/nit 심각도와 판정(Approve/Changes Requested/Blocked)이 담긴 리포트를 만든다. 가벼운 단일 패스 체크리스트인 `/review`와 달리, PR 올리기 전 깊이 있는 다각도 리뷰가 필요할 때 사용한다. "코드 리뷰 깊게 해줘", "/review-code", "병렬로 리뷰해줘" 같은 요청에 트리거.
---

# review-code: 병렬 다차원 코드 리뷰

3개의 전문 에이전트(`review-correctness`, `review-architecture`, `review-test-quality`)를 **동시에** 띄워 서로 다른 차원에서 같은 변경사항을 리뷰하고, 결과를 하나의 리포트로 합친다.

## 1. 리뷰 범위 결정

사용자가 인자로 특정 파일/경로를 지정했다면 그걸 스코프로 쓴다. 그렇지 않으면 아래 순서로 diff 범위를 정한다:

1. `git status --porcelain`으로 변경 여부 확인
2. `git diff` (unstaged) + `git diff --cached` (staged) 중 하나라도 내용이 있으면 그걸 스코프로 쓴다
3. 위 둘 다 비어 있으면 `git diff master...HEAD` (현재 브랜치 vs `master`)로 폴백
4. 그래도 비어 있으면 "리뷰할 변경사항이 없습니다"라고 안내하고 종료한다 — 에이전트를 띄우지 않는다

스코프가 정해지면, 각 에이전트에게 그대로 전달할 **정확한 git 명령 문자열**을 하나 확정해라 (예: `git diff && git diff --cached`, 또는 `git diff master...HEAD`). diff 텍스트 자체를 프롬프트에 복사해 넣지 마라 — 각 에이전트가 같은 명령을 직접 실행하게 해서 컨텍스트 낭비를 피한다.

## 2. 3개 에이전트를 한 메시지에서 병렬 launch

**반드시 하나의 응답 안에서 Agent 툴을 3번 호출**해라(순차 호출 금지 — 그러면 병렬로 실행되지 않는다). 백그라운드 실행이 기본값이니 `run_in_background`를 굳이 false로 바꾸지 마라.

각 호출:

| description | subagent_type |
|---|---|
| "정확성 리뷰" | `review-correctness` |
| "아키텍처/CRITICAL 준수 리뷰" | `review-architecture` |
| "테스트 품질 리뷰" | `review-test-quality` |

세 프롬프트 모두에 공통으로 포함할 내용:
- FinSight 프로젝트(CSV 업로드 → Claude 자동분류 → 인사이트, 포트폴리오/데모 앱)의 리뷰라는 배경 한 줄
- 1번에서 확정한 정확한 git 명령 (이 명령으로 diff를 직접 실행해서 확인하라고 지시)
- 결과를 agent 파일에 정의된 출력 형식(`FILE/LINE/SEVERITY/TITLE/TLDR/GOOD/FIX` 블록)으로 반환하라는 재확인

## 3. 완료 대기 및 취합

3개 에이전트의 완료 알림을 기다린다. **폴링하지 마라** — 알림이 오면 그때 결과를 확인한다. 셋 다 도착하기 전에는 리포트를 작성하지 않는다.

## 4. 중복 제거

같은 `FILE`+`LINE`(또는 겹치는 범위)을 두 에이전트 이상이 지적했다면 하나로 합친다. 합칠 때:
- `SEVERITY`는 더 높은 쪽(critical > major > minor > nit)을 채택
- `TLDR`은 더 구체적인 쪽을 채택하거나 짧게 병합
- `TITLE`/`GOOD`/`FIX`는 더 유용한 쪽을 채택

## 5. 최종 리포트 작성

정확히 아래 두 레이어로 작성한다. 임의로 필드를 추가하거나 순서를 바꾸지 마라.

### 레이어 1 — 인라인 코멘트

findings를 파일 → 줄번호 순으로 정렬해서, finding마다 4줄 블록:

```
[심각도] 제목
TL;DR: 한 줄 요약
✅ Good: 해당 코드 근처 잘된 점 (없으면 "-")
➡️ Fix: 구체적 수정 방향 또는 코드 스니펫
```

`[심각도]`는 `[🔴 critical]` / `[🟠 major]` / `[🟡 minor]` / `[🟢 nit]` 형태로 표기하고, 그 앞에 `file:line`을 헤더로 붙인다(예: `**src/services/claude.ts:42**`).

findings가 하나도 없으면 이 레이어는 생략하고 바로 레이어 2에서 "특이사항 없음"으로 짧게 마무리한다.

### 레이어 2 — PR 전체 요약 (전체 리뷰당 딱 1개)

```markdown
## 판정: {Approve | Changes Requested | Blocked}

🔴 critical N · 🟠 major N · 🟡 minor N · 🟢 nit N

### Walkthrough
{변경사항 2~3줄 개요}

### 잘된 점
{bullet 목록}

### Critical / Major
{critical·major만 file:line — 제목 형태로 나열. 없으면 "없음"}

### 다음 액션
{bullet 목록. 예: "critical 항목 수정 후 재리뷰", "이대로 커밋 가능" 등}
```

**판정 규칙** (반드시 이 순서로 적용):
1. `critical` ≥ 1개 → `Blocked`
2. `critical` = 0이고 `major` ≥ 1개 → `Changes Requested`
3. 둘 다 0 → `Approve` (minor/nit는 참고용, 판정에 영향 없음)

## 6. GitHub PR에 게시하기 (선택, 명시적으로 요청받았을 때만)

사용자가 "PR에 올려줘", "인라인 코멘트로 게시해줘"처럼 **실제 GitHub PR에 리뷰를 남기라고 명시적으로 요청한 경우에만** 이 단계를 수행한다. 기본 동작(그냥 `/review-code`)은 항상 5번까지만 하고 채팅으로 리포트를 보여준다 — PR에 뭔가를 쓰는 건 다른 사람에게 보이는 행동이므로 명시적 요청 없이는 하지 않는다.

### 6-1. 대상 PR과 commit 확정

- 사용자가 PR 번호/URL을 줬으면 그걸 쓴다.
- 안 줬으면 현재 브랜치 기준 `gh pr view --json number,headRefOid,url`로 연결된 PR을 찾는다. 없으면 사용자에게 PR 번호를 물어본다(추측해서 만들지 않는다).
- `headRefOid`가 리뷰 커밋(`commit_id`)이다. 리뷰 스코프로 실제 사용한 diff의 HEAD와 이 값이 같은지 확인해라 — 다르면 리뷰가 오래된 커밋 기준일 수 있으니 사용자에게 알린다.

### 6-2. 페이로드 구성

1~5번에서 만든 두 레이어를 GitHub Reviews API 페이로드로 변환한다:

- 레이어 1(인라인 코멘트) 각 finding → `comments[]`의 원소 하나:
  ```json
  { "path": "<FILE>", "line": <LINE 끝줄>, "side": "RIGHT", "body": "<4줄 블록을 마크다운으로>" }
  ```
  범위 finding(`LINE`이 `10-15`처럼 범위)은 `start_line`(시작줄)과 `line`(끝줄)을 함께 채운다. `side`는 항상 `RIGHT`(새 코드 기준)로 고정한다 — diff에서 삭제된 줄을 지적하는 경우가 아니면 `LEFT`를 쓸 일이 없다.
- 레이어 2(PR 요약) → 리뷰의 최상위 `body`.
- 판정 → `event`:
  - `Blocked` 또는 `Changes Requested` → `REQUEST_CHANGES`
  - `Approve` → `APPROVE`

이 JSON을 스크래치 파일로 저장한다(Bash 인자로 직접 넘기지 말 것 — 따옴표/이스케이프가 깨지기 쉽다).

### 6-3. 게시

```
gh api repos/{owner}/{repo}/pulls/{pr}/reviews --input <payload.json>
```

성공하면 반환된 리뷰 URL을 사용자에게 알려준다.

**본인이 연 PR인 경우**: GitHub는 `REQUEST_CHANGES`/`APPROVE`를 PR 작성자 본인에게는 거부한다(`422 Unprocessable Entity — "Can not request changes on your own pull request"`). 이 에러를 만나면 `event`를 `COMMENT`로 바꿔 재시도해라 — 코멘트 내용(판정 `Blocked` 등)은 그대로 `body`에 남으므로 정보 손실은 없고, GitHub의 리뷰 상태 뱃지만 `Commented`로 표시된다.

실패(예: `line`이 diff에 없는 줄을 가리킴 — GitHub는 diff hunk 밖의 줄에는 코멘트를 거부한다)하면 어떤 finding이 실패했는지 사용자에게 보고하고, 나머지는 게시된 상태로 둘지 롤백할지 물어본다.

## 확장하기 (지금은 하지 않음)

리뷰 차원을 늘리고 싶으면(예: security/privacy, performance, cross-file consistency, conventions, behavioral correctness, CPU/perf patterns): `.claude/agents/review-<dimension>.md`를 이 3개 에이전트와 같은 형식(같은 출력 스키마, 같은 심각도 기준)으로 하나 추가하고, 위 2번 표에 한 줄만 추가하면 된다. security/privacy 관련 CRITICAL 규칙(LLM 전송 경계, RLS)은 이미 `review-architecture`가 커버하므로 지금은 별도로 쪼개지 않는다.
