# Step 1: design-tokens

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/DESIGN.md` — 전체 이식 방침, "지켜야 하는 것" 절
- `/design/finsight-dark.css` — 팔레트 원본
- `/design/_ds/*/tokens/colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `fonts.css` — 원본 토큰 정의
- Step 0 산출물: `src/app/layout.tsx`, `package.json`, `tsconfig.json` — 지금까지의 프로젝트 구조를 파악한다.

Step 0에서 Next.js 프로젝트는 초기화됐지만 Tailwind CSS는 아직 설치되지 않았다. 이 step에서 설치부터 시작한다.

## 작업

1. **Tailwind CSS 설치**: 최신 안정 버전(v4 계열)을 설치한다. `@tailwindcss/postcss`를 PostCSS 플러그인으로 등록하고, `src/app/globals.css` 최상단에 `@import "tailwindcss";`를 추가한다. `tailwind.config.ts`는 v4에서는 필수가 아니다 — CSS의 `@theme` 블록으로 테마를 정의한다.

2. **원본 토큰을 이름 그대로 이식**한다. `design/finsight-dark.css`의 `:root` 블록과 `_ds/*/tokens/*.css`에 정의된 커스텀 프로퍼티(`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--tracking-*`, `--font-*` 등)를 `src/app/globals.css`의 `:root`에 **원래 변수명 그대로** 옮긴다. 값도 원본 그대로 가져온다.

3. **예외: `--accent`만 값을 바꾼다.** `finsight-dark.css`의 `--accent` 기본값은 `#4b7bff`(blue)이지만, `docs/DESIGN.md`에 확정된 값은 `#3ecf8e`(green)다. **`--accent: #3ecf8e`로 설정한다.** `--accent` 하나만 바꾸면 `color-mix()`로 정의된 나머지 `--color-primary-*` 계열이 자동으로 따라온다 — 그 값들을 직접 건드리지 마라.

4. **shadcn/ui 표준 CSS 변수 계약을 별칭으로 추가**한다. 다음 step에서 `shadcn init`으로 생성될 컴포넌트들이 아래 이름을 그대로 소비하므로, 원본 토큰을 참조하는 별칭 변수를 같은 `:root`에 추가한다:

   | shadcn 변수 | 값 |
   |---|---|
   | `--background` | `var(--color-surface-soft)` |
   | `--foreground` | `var(--color-ink)` |
   | `--card`, `--popover` | `var(--color-surface-strong)` |
   | `--card-foreground`, `--popover-foreground` | `var(--color-ink)` |
   | `--primary` | `var(--color-primary)` |
   | `--primary-foreground` | `var(--color-on-primary)` |
   | `--secondary` | `var(--color-surface-strong)` |
   | `--secondary-foreground` | `var(--color-ink)` |
   | `--muted` | `var(--color-muted-soft)` |
   | `--muted-foreground` | `var(--color-muted)` |
   | `--accent` | `var(--color-primary-soft)` |
   | `--accent-foreground` | `var(--color-ink)` |
   | `--destructive` | `var(--color-danger)` |
   | `--border` | `var(--color-hairline)` |
   | `--input` | `var(--color-hairline-soft)` |
   | `--ring` | `var(--color-primary)` |
   | `--radius` | `tokens/radius.css`에서 카드/버튼 등 일반 컴포넌트에 쓰이는 기본 반경 값을 확인해 사용 |

   **네이밍 충돌 주의**: finsight의 `--accent`(포인트 컬러, `#3ecf8e`)는 위 표에서 shadcn의 `--primary`에 매핑된다. shadcn 자체의 `--accent`(드롭다운/메뉴 hover 배경 같은 보조 강조색)는 **다른 것**이며 `--color-primary-soft`에 매핑한다. 이름이 같다고 shadcn `--accent`에 포인트 컬러 값을 넣지 마라 — 버튼 배경과 hover 배경의 색이 뒤바뀐다.

5. **다크 모드 고정**: 라이트 테마 변수 세트나 `.light`/미디어쿼리 분기를 만들지 않는다. `next-themes` 등 테마 토글 라이브러리를 설치하지 않는다. `src/app/layout.tsx`의 `<html>` 태그에 `className="dark"`를 고정으로 둔다 — shadcn 컴포넌트 내부의 `dark:` variant가 이 클래스로 활성화된다. Tailwind v4에서 `dark:` variant를 쓰려면 `globals.css`에 `@custom-variant dark (&:where(.dark, .dark *));`를 선언해야 한다 — 빠뜨리면 `dark:` 클래스가 전부 무시된다.

6. **폰트**: `_ds/*/tokens/fonts.css`를 참고해 Inter(sans-serif)와 JetBrains Mono(monospace)를 `next/font/google`로 로드하고, 각각 `--font-sans`/`--font-mono` CSS 변수에 연결한다 (`next/font`가 자동 생성하는 변수를 `:root`의 `--font-sans`/`--font-mono`에 매핑).

7. `@theme inline { ... }` 블록(Tailwind v4 문법)에서 위 별칭들(`--color-background: var(--background)` 형태)과 `--font-sans`, `--font-mono`, `--radius`를 선언해 `bg-background`, `text-foreground`, `font-mono`, `rounded-* ` 같은 Tailwind 유틸리티로 노출한다.

## Acceptance Criteria

```bash
npm run lint
npm run build
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/app/globals.css`에서 다음을 확인한다:
   - `--accent: #3ecf8e` (원본 `#4b7bff`가 아님)
   - `--color-*`, `--space-*`, `--radius-*`, `--shadow-*` 원본 토큰이 이름 그대로 존재하는가
   - shadcn 별칭 변수(`--background` ~ `--ring`)가 모두 정의됐는가
   - `.light`, `prefers-color-scheme` 등 라이트 테마 분기가 없는가
   - `package.json`에 `next-themes` 등 테마 토글 의존성이 없는가
3. `phases/0-project-scaffolding/index.json`의 step 1 항목을 업데이트한다 (성공/error/blocked 처리는 Step 0과 동일한 규칙).

## 금지사항

- `next-themes` 등 테마 토글 라이브러리를 설치하지 마라. 이유: PRD·CLAUDE.md가 "다크 모드 고정"을 명시했고, 토글 인프라 자체가 이 프로젝트에 존재해선 안 된다.
- `npx shadcn@latest init`을 이 step에서 실행하지 마라. 이유: 다음 step(`shadcn-ui`)의 몫이며, 여기서 먼저 실행하면 "기존 토큰을 비파괴적으로 보존하며 병합"이라는 다음 step의 전제가 어긋난다.
- `finsight-dark.css`의 `--accent` 원본값(`#4b7bff`)을 그대로 쓰지 마라. 이유: `docs/DESIGN.md`에서 `#3ecf8e`로 최종 확정됐다.
- 컴포넌트(Button, Card 등)를 만들지 마라. 이 step은 CSS 토큰/Tailwind 설정만 다룬다.
- 기존 테스트를 깨뜨리지 마라.
