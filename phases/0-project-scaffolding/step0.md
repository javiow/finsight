# Step 0: next-init

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 디렉토리 구조 절
- `/docs/ADR.md` — ADR-001(Supabase), ADR-008(API 계약 우선)
- `/AGENTS.md` — 기술 스택, 명령어, harness 규칙

저장소 루트에는 아직 `package.json`이 없다. 이 step이 Next.js 프로젝트의 최초 초기화다.

## 작업

Next.js 15 App Router 프로젝트를 저장소 루트에 초기화한다 (별도 하위 디렉토리를 만들지 않는다 — `package.json`, `src/` 등이 저장소 루트에 위치한다).

1. **Next.js 초기화**: TypeScript strict mode, App Router, `src/` 디렉토리 사용, import alias `@/*`, ESLint 포함. **Tailwind CSS는 이 step에서 설치하지 않는다** — 다음 step(`design-tokens`)에서 다룬다. `create-next-app`을 비대화형으로 실행하거나(플래그로 모든 프롬프트에 답), 직접 `package.json`/`tsconfig.json`/`next.config.ts`를 작성해도 된다.
2. **tsconfig.json**: `strict: true` 확인 (기본값이지만 명시적으로 확인할 것).
3. **폴더 골격** (ARCHITECTURE.md 구조를 따른다, 지금은 빈 폴더가 아니라 각 폴더의 용도를 나타내는 최소 placeholder만 둔다):
   - `src/components/`
   - `src/types/`
   - `src/lib/`
   - `src/services/`
   - `supabase/migrations/`
   빈 디렉토리는 git에 커밋되지 않으므로, 각 폴더에 해당 폴더의 용도를 한 줄로 설명하는 `.gitkeep` 또는 최소 placeholder 파일을 두거나, 이후 step에서 실제 파일이 채워질 때까지 디렉토리 생성을 미뤄도 된다 — 어느 쪽이든 상관없다.
4. **Vitest 설정**: `vitest.config.ts` 추가. 아직 테스트 파일이 하나도 없으므로 `test.passWithNoTests: true`를 설정해 `npm run test`가 빈 상태에서도 성공하게 한다 (이후 step에서 실제 테스트가 추가되면 자연히 검증된다).
5. **package.json 스크립트** 확정:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "lint": "eslint .",
       "test": "vitest run"
     }
   }
   ```
6. **최소 페이지**: `src/app/layout.tsx`, `src/app/page.tsx`를 Next.js 기본 템플릿 수준으로 둔다 — 실제 랜딩 페이지 구현은 이후 task의 몫이다. `npm run build`가 통과할 정도의 최소 내용이면 충분하다.
7. `.gitignore`에 `node_modules`, `.next`, `*.local`, `.env*.local` 등 Next.js 표준 항목이 포함되어 있는지 확인한다.

## Acceptance Criteria

```bash
npm install
npm run lint
npm run build
npm run test
```

네 커맨드 모두 에러 없이 종료해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `src/app`, `src/components`, `src/types`, `src/lib`, `src/services` 구조가 ARCHITECTURE.md와 일치하는가?
   - `tsconfig.json`의 `strict`가 `true`인가?
   - Tailwind 관련 파일(`tailwind.config.*`, `postcss.config.*`)이 아직 생성되지 않았는가? (다음 step 몫이므로 여기서 만들면 안 된다)
3. 결과에 따라 `phases/0-project-scaffolding/index.json`의 step 0 항목을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "생성/수정된 파일과 핵심 설정을 한 줄로"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- Tailwind CSS, shadcn/ui를 설치하지 마라. 이유: 다음 두 step이 각각 담당하며, 여기서 먼저 설치하면 그 step들의 "설치부터 시작한다"는 전제가 깨진다.
- Supabase 클라이언트, DB 마이그레이션, `src/types/api.ts`를 만들지 마라. 이유: 이후 step에서 다룬다. 지금 만들면 이후 step이 "이미 있다"고 잘못 판단하거나 중복 작업이 생긴다.
- 랜딩 페이지나 대시보드 UI를 실제로 구현하지 마라. 이유: 디자인 토큰과 shadcn 컴포넌트가 없는 상태에서 UI를 만들면 이후 다시 만들어야 한다.
- `pnpm`이나 `yarn`으로 전환하지 마라. 이유: `AGENTS.md`/`CLAUDE.md` 명령어가 전부 `npm run *` 기준이다.
