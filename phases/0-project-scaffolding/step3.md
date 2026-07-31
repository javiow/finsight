# Step 3: supabase-clients

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — "패턴" 절의 조회/변경 경로 표, "디렉토리 구조"의 `src/lib/` 설명
- `/docs/ADR.md` — ADR-001(Supabase 올인원)
- `/CLAUDE.md` — CRITICAL 규칙 전체, 특히 service-role 클라이언트와 `server-only` 관련 항목
- Step 0에서 생성된 `package.json`, `vitest.config.ts` — 테스트 실행 방식을 파악한다.

## 작업

1. 패키지 설치: `@supabase/supabase-js`, `@supabase/ssr`.
2. `.env.example` 작성 (실제 값은 넣지 않고 플레이스홀더만):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
3. `src/lib/supabase/browser.ts` — 브라우저(Client Component)용 클라이언트 팩토리.
   ```ts
   export function createClient(): SupabaseClient
   ```
   `@supabase/ssr`의 `createBrowserClient`를 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`로 호출한다.
4. `src/lib/supabase/server.ts` — Server Component/Route Handler용 클라이언트 팩토리.
   ```ts
   export async function createClient(): Promise<SupabaseClient>
   ```
   `@supabase/ssr`의 `createServerClient`를 Next.js 15의 (비동기) `cookies()`와 연동한다. RLS가 걸린 채로 동작해야 하므로 anon key를 쓴다.
5. `src/lib/supabase/service.ts` — service-role 클라이언트. **파일 최상단 첫 줄에 `import 'server-only'`를 반드시 넣는다** (CLAUDE.md CRITICAL 규칙 — 이 import가 없으면 이 클라이언트가 실수로 클라이언트 번들에 포함될 수 있고, 그러면 RLS를 우회하는 service-role 키가 브라우저에 노출된다).
   ```ts
   export function createServiceClient(): SupabaseClient
   ```
   `SUPABASE_SERVICE_ROLE_KEY`로 `@supabase/supabase-js`의 `createClient`를 직접 호출한다(세션 쿠키 불필요).
6. **TDD**: 세 팩토리 함수 각각에 대응하는 테스트를 구현보다 먼저 작성한다(`browser.test.ts`, `server.test.ts`, `service.test.ts`, 같은 디렉토리). `@supabase/supabase-js`와 `@supabase/ssr`을 `vi.mock`으로 모킹하고 다음을 검증한다:
   - 각 팩토리가 올바른 환경변수 이름으로 클라이언트 생성 함수를 호출하는가 (예: `createBrowserClient`가 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` 값을 받는가).
   - `service.ts`가 anon key가 아니라 `SUPABASE_SERVICE_ROLE_KEY`를 쓰는가.
   실제 네트워크 호출이나 실제 Supabase 프로젝트 연결은 하지 않는다 — 전부 모킹으로 검증한다.

## Acceptance Criteria

```bash
npm run lint
npm run build
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/lib/supabase/service.ts`의 첫 줄이 `import 'server-only'`인지 확인한다.
3. 세 파일 모두 대응하는 `*.test.ts`가 존재하고 실제로 통과하는지 확인한다.
4. `phases/0-project-scaffolding/index.json`의 step 3 항목을 업데이트한다 (성공/error/blocked 처리는 Step 0과 동일한 규칙).

## 금지사항

- `middleware.ts`, 인증 가드, 로그인/회원가입 페이지를 만들지 마라. 이유: 이 task의 범위는 클라이언트 팩토리까지이며, 세션 갱신·인증 플로우는 다음 task(인증)의 몫이다.
- 실제 Supabase 프로젝트를 생성하거나 CLI로 원격 연결하는 명령(`supabase link`, `supabase db push`, `supabase gen types` 등 네트워크 동작)을 실행하지 마라. 이유: 연결할 실제 프로젝트가 없고, API 키 발급은 사용자가 직접 해야 하는 수동 단계다 — 필요하면 `blocked` 처리하고 사유를 남긴다.
- `.env.example`이 아닌 `.env`/`.env.local`에 실제 키 값을 채워 넣지 마라. 이유: 발급된 키가 없고, 있어도 커밋되어선 안 된다.
- 기존 테스트를 깨뜨리지 마라.
