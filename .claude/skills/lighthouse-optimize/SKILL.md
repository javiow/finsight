---
name: lighthouse-optimize
description: Lighthouse 점수를 기준으로 FinSight 공개 페이지(/, /pricing, /login) 성능을 자동으로 반복 개선하는 루프. "측정(스크립트) → 분석 → perf-fixer 서브에이전트로 수정 → 재측정" 사이클을 목표 점수 도달·정체·최대 반복 중 하나에 걸릴 때까지 돌린다. "라이트하우스 최적화해줘", "성능 최적화 루프 돌려줘", "/lighthouse-optimize", "Lighthouse 점수 올려줘" 같은 요청에 트리거.
---

# lighthouse-optimize: Lighthouse 기반 성능 최적화 루프

karpathy/autoresearch의 "고정 예산으로 수정→평가→기록을 반복하고, 측정과 수정 주체를 분리한다"는 구조를 성능 최적화에 맞춘 것이다. 측정(`scripts/lighthouse-run.mjs`)은 항상 기계적으로 동일한 방식으로 채점하고, 코드 수정은 `perf-fixer` 서브에이전트가 전담한다 — 오케스트레이터(너 자신)는 둘을 연결하고 종료를 판단하는 역할만 한다.

## 0. 범위

측정 대상은 인증이 필요 없는 공개 라우트 3개로 고정한다: `/`(landing), `/pricing`, `/login`. 대시보드/거래내역/트렌드는 로그인 세션이 있어야 의미 있는 측정이 되므로 이 루프에서 다루지 않는다 — 사용자가 명시적으로 인증된 페이지 측정을 요청하면, 먼저 Lighthouse에 세션 쿠키/storageState를 주입하는 방법이 필요하다는 점을 알리고 별도로 논의해라(지금 스크립트는 이를 지원하지 않는다).

기본값: 목표 성능 점수 95(3라우트 평균), 최대 5 iteration. 사용자가 다른 목표나 횟수를 말하면 그에 맞게 조정해라 — 별도 CLI 플래그 파싱 없이 이 스킬 실행 중 자연어로 반영하면 된다.

## 1. 사전 준비

- `devDependencies`에 `lighthouse`, `chrome-launcher`가 있는지 `package.json`에서 확인해라. 없으면 `npm install --save-dev lighthouse chrome-launcher`로 설치해라.
- 로컬에 Chrome이 설치되어 있어야 한다(`chrome-launcher`가 자동 탐지, 스크립트는 Windows 기본 설치 경로를 폴백으로 넣어뒀다). 못 찾으면 사용자에게 Chrome 설치 여부를 물어라.
- `git status`로 작업 중인 변경사항이 있는지 확인해라. 있으면 이 루프가 그 위에 코드를 계속 덧붙이게 된다는 걸 사용자에게 알리고, 필요하면 먼저 커밋/스태시할지 물어라.

## 2. 루프

각 iteration마다 아래 사이클을 그대로 반복한다. **한 번에 하나의 iteration만 진행하고, 각 단계 결과를 확인한 뒤 다음 단계로 넘어가라** — 서버 기동 실패나 빌드 에러를 다음 iteration까지 끌고 가지 않는다.

### a. 빌드
```
npm run build
```
빌드가 실패하면 루프를 멈추고 에러를 사용자에게 보고해라(코드가 깨진 상태에서 측정을 진행하지 않는다).

### b. 측정
```
node scripts/lighthouse-run.mjs
```
`--iteration`은 생략해라 — 스크립트가 `lighthouse-reports/history.json`을 보고 알아서 다음 번호를 매긴다. 이 명령은 프로덕션 서버를 4173 포트에 띄우고, 3개 라우트를 Lighthouse로 측정하고, 서버를 내린 뒤 stdout에 라우트별 4개 카테고리 점수·Core Web Vitals·상위 5개 opportunity·이전 iteration 대비 performance 변화를 출력한다. 이 stdout 요약을 그대로 판단 근거로 써라 — `lighthouse-reports/history.json`이나 개별 JSON 리포트를 직접 열어볼 필요는 보통 없다(디버깅이 필요할 때만 열어라).

### c. 종료 조건 확인

아래 중 하나라도 해당하면 루프를 멈추고 5번(최종 리포트)로 가라:

1. **목표 달성**: 3라우트 performance 평균 ≥ 목표 점수(기본 95)
2. **정체**: 직전 iteration 대비 3라우트 performance 평균 개선폭이 2점 미만인 상태가 **2회 연속**
3. **예산 소진**: iteration 수가 최대치(기본 5)에 도달
4. **더 고칠 게 없음**: 직전 iteration의 perf-fixer가 `SAFE_FIXES_EXHAUSTED`를 보고했음

멈추지 않으면 d로 진행한다.

### d. 수정 대상 선정

이번 iteration의 stdout 요약에서 라우트별 top opportunities를 모아라. 이미 이전 iteration에서 `SKIPPED`로 보고된 audit id는 다시 넘기지 마라(같은 이유로 또 스킵될 뿐이다). 3라우트를 합쳐 추정 절감치(savingsMs) 기준 상위 5~8개 정도로 추려서 다음 audit에 집중하게 해라 — 한 번에 너무 많이 던지면 얕은 수정만 하게 된다.

### e. 수정 (perf-fixer 서브에이전트)

`Agent` 툴로 `subagent_type: perf-fixer` 하나를 띄운다(병렬 아님 — 순차 루프이므로 매 iteration 하나씩). 프롬프트에 반드시 포함:
- FinSight 프로젝트, 지금이 몇 번째 iteration인지
- d에서 추린 audit 목록: 각각 `audit id / title / 라우트 / 추정 savingsMs`
- 이전 iteration에서 `SKIPPED`된 항목이 있다면 그 목록과 사유(반복 시도 방지용 참고 정보)

완료 알림을 기다린 뒤(폴링하지 마라), 응답에서 `AUDIT/FILES/DID/EXPECT/TESTS` 블록들과 `SKIPPED`, 있다면 `SAFE_FIXES_EXHAUSTED`를 기록해둬라 — 최종 리포트와 다음 iteration의 "이미 스킵됨" 목록에 쓴다.

### f. 다음 iteration

a로 돌아가 반복한다.

## 3. 완료 후 커밋

**자동으로 커밋하지 마라.** 루프가 끝나면 `git status`/`git diff --stat`로 변경된 파일 목록만 보여주고, 사용자가 리뷰 후 직접 커밋 여부를 정하게 해라. 사용자가 이번 요청에서 "끝나면 커밋해줘"처럼 명시적으로 말한 경우에만 conventional commits 형식(`perf:`)으로 커밋해라.

## 4. 최종 리포트

아래 구조로 채팅에 정리해라:

```
## Lighthouse 최적화 루프 결과

종료 사유: {목표 달성 | 정체 | 예산 소진 | 더 고칠 게 없음}

### 점수 추이 (performance, 라우트별)
| iteration | landing | pricing | login | 평균 |
|---|---|---|---|---|
...

### 적용된 수정 ({N}건)
- [iteration N] AUDIT — 파일 — 한 줄 요약

### 스킵된 항목 (있다면)
- AUDIT — 사유

### 남은 것
{목표 미달성으로 끝났다면: 남은 top opportunity와 왜 자동 수정이 안전하지 않았는지}

리포트 원본: lighthouse-reports/ (git에는 커밋되지 않음, .gitignore 처리됨)
```
