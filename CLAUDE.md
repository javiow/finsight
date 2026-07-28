# 프로젝트: FinSight

카드 명세서 CSV를 올리면 Claude가 자동 분류하고 지출 인사이트를 돌려주는 개인용 가계부 SaaS.
전체 계획은 레포 루트의 `plan.md`에 있다. 상세가 필요하면 그 문서의 해당 절을 읽어라.

## 기술 스택
- Next.js 15 App Router
- TypeScript strict mode
- Tailwind CSS + shadcn/ui (복사 붙여넣기, 벤더 종속 없음)
- Supabase — Auth · Postgres · Storage · RLS
- Anthropic Claude API (`claude-sonnet-5`)
- Polar (`@polar-sh/nextjs`) — 구독 결제
- Recharts — 차트
- Vitest — 테스트
- 배포: Vercel Pro (상용). Hobby는 개인·비상업 개발용으로만 쓴다

## 아키텍처 규칙

- CRITICAL: 외부 API 호출(Anthropic, Polar)과 service-role Supabase 접근은 `app/api/` 라우트 핸들러 안에서만 한다. 클라이언트 컴포넌트에서 직접 호출 금지.
- CRITICAL: 데이터 변경(insert/update/delete)은 전부 `app/api/` 라우트 핸들러를 거친다.
- CRITICAL: 사용자 요청 API는 middleware와 별개로 자체 세션 검증을 수행한다. Polar webhook은 raw body 서명 검증, Vercel cron은 `CRON_SECRET` 검증으로 인증한다.
- CRITICAL: 브라우저는 사용자 데이터 SELECT만 직접 수행할 수 있다. INSERT/UPDATE/DELETE는 DB 권한과 RLS 정책으로 막고 `app/api/` service-role 핸들러만 수행한다.
- CRITICAL: 원본 CSV와 식별정보를 외부 모델에 보내지 않는다. LLM에는 비식별화된 미리보기·가맹점명·집계 숫자만 목적별로 보낸다 (`plan.md` §8 LLM 전송 경계).
- 단순 조회는 Server Component에서 `@supabase/ssr` 서버 클라이언트로 직접 수행한다. 접근 제어는 RLS가 담당한다.
- service-role 클라이언트는 `src/lib/supabase/service.ts` 한 곳에만 두고 파일 최상단에 `import 'server-only'`를 둔다.
- 컴포넌트는 `src/components/`, 타입은 `src/types/`, 유틸은 `src/lib/`, 외부 API 래퍼는 `src/services/`에 둔다.

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성할 것 (TDD)
- CRITICAL: `src/types/api.ts`의 요청·응답 타입과 에러 코드가 API 계약의 유일한 출처다. 새 필드명을 지어내지 말고 이 파일을 먼저 읽어라.
- 실패는 격리하고 진행은 보존한다. 행 하나가 깨져 명세서 전체를 실패시키거나, 배치 하나가 실패해 앞선 배치를 날리지 않는다.
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)

## 명령어
```
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # 테스트
```
