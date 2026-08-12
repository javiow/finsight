# 프로젝트: FinSight

카드 명세서 CSV를 올리면 Claude가 자동 분류하고 지출 인사이트를 돌려주는 개인용 가계부 SaaS.
**포트폴리오/데모**다 — Polar 샌드박스만 쓰고 실제 정산은 없다.

전체 설계는 `docs/`에 있다. 상세가 필요하면 해당 문서의 해당 절을 읽어라.

- `docs/PRD.md` — 사용자 · 핵심 기능 · 요금제 · 프라이버시 약속
- `docs/ARCHITECTURE.md` — 디렉토리 구조 · 데이터 흐름 · LLM 전송 경계
- `docs/ADR.md` — 설계 결정과 트레이드오프
- `docs/DESIGN.md` — `design/` 프로토타입 파일 지도 · 화면→라우트 매핑 · 이식 방침
- `docs/UX.md` — UI 원칙(Figma 7원칙) · 유저 유치·온보딩 퍼널 · 화면별 체크리스트
- `docs/QA_SCENARIOS.md` — 브라우저 테스팅 시나리오 체크리스트. 브라우저로 화면을 확인할 때마다 먼저 읽는다

## 기술 스택
- Next.js 15 App Router
- TypeScript strict mode
- Tailwind CSS + shadcn/ui (복사 붙여넣기, 벤더 종속 없음)
- Supabase — Auth · Postgres · Storage · RLS
- Anthropic Claude API (`claude-opus-5`)
- Polar (`@polar-sh/nextjs`) — 구독 결제, 샌드박스 환경
- Recharts — 차트
- Vitest — 테스트
- 배포: Vercel Pro (상용). Hobby는 개인·비상업 개발용으로만 쓴다
- **다크 모드 고정.** 테마 토글 라이브러리를 넣지 않는다 (`design/finsight-dark.css`가 팔레트 원본)

## 아키텍처 규칙

- CRITICAL: 외부 API 호출(Anthropic, Polar)과 service-role Supabase 접근은 `app/api/` 라우트 핸들러 안에서만 한다. 클라이언트 컴포넌트에서 직접 호출 금지.
- CRITICAL: 브라우저는 사용자 데이터 SELECT만 직접 수행한다. 모든 insert/update/delete는 `app/api/` service-role 핸들러를 거치며, 이 규칙은 DB 권한(`authenticated` 역할에서 revoke)과 RLS로 강제한다.
- CRITICAL: 사용자 요청 API는 middleware와 별개로 자체 세션 검증을 수행한다. Polar webhook은 raw body 서명 검증, Vercel cron은 `CRON_SECRET` 검증으로 인증한다.
- CRITICAL: 원본 CSV와 식별정보를 외부 모델에 보내지 않는다. LLM에는 비식별화된 미리보기·가맹점명·집계 숫자만 목적별로 보낸다 (`docs/ARCHITECTURE.md` "LLM 전송 경계").
- CRITICAL: 플랜 게이팅은 서버에서만 판정한다. 클라이언트 조건부 렌더는 UI일 뿐이고 차단은 `src/lib/plan.ts`의 `requirePro`가 한다.
- 단순 조회는 Server Component에서 `@supabase/ssr` 서버 클라이언트로 직접 수행한다. 접근 제어는 RLS가 담당한다.
- service-role 클라이언트는 `src/lib/supabase/service.ts` 한 곳에만 두고 파일 최상단에 `import 'server-only'`를 둔다.
- 컴포넌트는 `src/components/`, 타입은 `src/types/`, 유틸은 `src/lib/`, 외부 API 래퍼는 `src/services/`에 둔다.
- AI 모델 ID는 `src/services/claude.ts`의 상수 하나로 관리한다. 호출부에 모델 문자열을 흩뿌리지 않는다.
- LLM 결과는 캐싱한다 — 카테고리는 (유저, 가맹점명), 인사이트는 (유저, 기간). 같은 입력에 재호출하면 API 비용이 그대로 중복된다. 매핑은 캐시하지 않는다(명세서당 1회라 값어치가 없다).

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성할 것 (TDD)
- **TDD Guard 훅이 실제로 차단한다** (`scripts/hooks/tdd-guard.sh` — `PreToolUse[Write|Edit]`). 대응하는 테스트 파일이 없으면 구현 파일 작성이 거부된다.
  - 면제: `*.test.*` / `*.spec.*` / `__tests__`, `types/` 하위, `design/` 하위, `*.json`/`*.css`/`*.md`/`*.yml`/`*.env*`/`*.config.*`, Next.js 프레임워크 파일(`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `globals.css`)
  - **`app/api/*/route.ts`는 면제 대상이 아니다.** API 라우트도 테스트를 먼저 작성해야 한다.
  - SQL migration은 `.sql`이라 훅을 타지 않지만, RLS 정책은 별도로 검증할 것.
- CRITICAL: `src/types/api.ts`의 요청·응답 타입과 에러 코드가 API 계약의 유일한 출처다. 새 필드명을 지어내지 말고 이 파일을 먼저 읽어라.
- **세션 종료 시 `npm run lint && npm run build && npm run test`가 자동 실행된다** (Stop 훅). 세 개 모두 통과하는 상태로 작업을 마칠 것.
- 실패는 격리하고 진행은 보존한다. 행 하나가 깨져 명세서 전체를 실패시키거나, 배치 하나가 실패해 앞선 배치를 날리지 않는다.
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)

## CI 실패 자동 수정 (온콜)
- `.github/workflows/ci.yml`(lint/build/test)이 실패하면 `.github/workflows/oncall-ci-fix.yml`이 `workflow_run`으로 깨어나 `.claude/skills/oncall-fix`를 호출한다. 트리거는 CI 실패 자체이지 사람의 요청이 아니다.
- 이 에이전트는 실패한 job 로그만 읽고, `oncall/` 브랜치에 최소 수정을 커밋해 PR을 연다. **master 직접 push·자동 머지 경로는 없다** — 항상 사람이 PR을 리뷰·머지한다.
- 설계와 루프·시크릿 방지 근거는 `docs/ADR.md` ADR-012 참고.

## Oncall Autopilot (유저 응대 · 운영 Q&A)
- `.claude/skills/oncall-autopilot`가 FinSight 유저 문의/에러 응대 초안과 운영 동료의 시스템 질문에 답한다. 근거는 코드베이스·PostHog 로그·에러 트래킹·Supabase read-only DB 세 가지뿐이고, 근거 없는 문장은 "확인 필요"로 남긴다 — 지어내지 않는다.
- 유저에게 나가는 답변은 항상 "DRAFT — 사람 승인 필요"로만 산출된다. 이 스킬은 스스로 어디에도 발송·게시하지 않는다. 내부 팀 질문은 승인 게이트 없이 바로 답한다.
- DB는 조회만 한다. 구독 해지·환불·계정 변경처럼 쓰기가 필요한 요청은 실행하지 않고 에스컬레이션으로 사람에게 넘긴다.
- 지금은 상시 입구(웹훅·챗봇 연동) 없이 사람이 직접 호출하는 로컬 one-shot이다. 설계 근거는 `docs/ADR.md` ADR-013 참고.

## Oncall Alert Triage (prod alert 1차 방어선)
- `POST /api/webhooks/posthog-alert`는 PostHog 에러 트래킹 웹훅(단건+급증 alert)을 받아 (1) `X-Webhook-Secret` 검증 (2) `oncall_alert_events`에 `event_id` 선삽입으로 멱등 확보 (3) GitHub `repository_dispatch`(`posthog-alert`)로 CI 위임까지만 한다. 노이즈/신호 판정은 하지 않는다 — 서버리스는 `claude -p`를 띄울 수 없기 때문이다.
- 실제 판정·분석·에스컬레이션은 `.github/workflows/oncall-alert-triage.yml`이 깨우는 `.claude/skills/oncall-alert-triage`(헤드리스 Claude)가 한다. 노이즈(알려진 일시적·단발·봇)면 CI 로그에 근거만 남기고 종료하고, 신호(새 에러·여러 유저·급증·핵심 경로)면 무슨 에러/언제부터/몇 명/의심 원인(최근 커밋 overlap)/영향 범위/권장 액션을 담은 GitHub Issue를 연다. 경계 판정은 신호로 기울이되 `confidence: low`로 표기한다. 동일 근본 원인은 이슈 본문의 dedup 마커로 합쳐 코멘트만 남긴다.
- 이 CI 잡에는 Supabase 자격 증명을 전달하지 않는다 — read-only를 규율이 아니라 "DB를 건드릴 수단 자체가 없음"으로 강제한다. prod 코드·DB 수정 경로는 없다.
- `POSTHOG_ALERT_WEBHOOK_SECRET`(PostHog 웹훅 destination 커스텀 헤더와 동일 값)·`GITHUB_DISPATCH_TOKEN`(fine-grained PAT)·CI의 `POSTHOG_PERSONAL_API_KEY`는 코드가 아니라 수동 발급·등록이 필요하다 — 배포 체크리스트에 남길 것. 설계 근거는 `docs/ADR.md` ADR-014 참고.

## 명령어
```
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # 테스트
```
