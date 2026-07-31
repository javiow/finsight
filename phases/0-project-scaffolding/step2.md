# Step 2: shadcn-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/DESIGN.md` — "컴포넌트 이식 방침" 절 (shadcn으로 대체할 목록 / 직접 만들 목록)
- Step 1에서 작성된 `src/app/globals.css` — 이식된 토큰과 shadcn 변수 별칭을 반드시 먼저 확인한다.

## 작업

1. `npx shadcn@latest init`을 실행한다. **실행 중 기존 `src/app/globals.css`나 Tailwind 설정을 덮어쓸지 묻는 프롬프트가 나오면 덮어쓰지 않는다** — Step 1에서 이식한 토큰을 보존해야 한다. CLI가 프롬프트 없이 `globals.css`를 자동으로 다시 썼다면, `git diff`로 Step 1의 토큰(특히 `--accent: #3ecf8e`와 원본 `--color-*`/`--space-*`/`--radius-*`/`--shadow-*` 변수들)이 사라졌는지 확인하고, 사라졌다면 Step 1의 내용으로 복원한 뒤 shadcn이 추가한 부분(예: `--radius` 관련 유틸 매핑)만 병합한다.
2. 생성된 `components.json`에서 `tailwind.cssVariables: true`, `aliases.components`가 `@/components`를 가리키는지 확인한다. `baseColor`(neutral/zinc 등)는 어떤 값이어도 무방하다 — 실제 색상 값은 이미 Step 1의 토큰이 덮어쓴다.
3. 다음 컴포넌트를 추가한다: `button`, `input`, `select`, `checkbox`, `switch`, `badge`, `dialog`, `tabs`, `tooltip`, `sonner`(Toast 대체).
4. 각 컴포넌트 파일(`src/components/ui/*.tsx`)을 확인해 하드코딩된 색상 유틸(`bg-white`, `text-black`, `bg-slate-900` 같은 팔레트 클래스나 raw hex)이 있는지 점검한다. shadcn 기본 생성 컴포넌트는 보통 `bg-primary`, `text-foreground` 같은 토큰 클래스만 쓰므로 정상이면 손댈 필요가 없다. 만약 하드코딩된 색상이 있다면 대응하는 토큰 클래스로 교체한다.
5. `src/app/page.tsx`에 `Button` 컴포넌트를 하나 임시로 렌더링해 `npm run dev`로 accent 색(`#3ecf8e`)이 실제로 적용되는지 육안으로 확인한다. 이건 개발 중 1회성 확인이며, 확인 후 `page.tsx`는 Step 0 상태(최소 placeholder)로 되돌려도 되고 그대로 둬도 된다 — 실제 랜딩 페이지 구현은 이 task의 범위가 아니다.

## Acceptance Criteria

```bash
npm run lint
npm run build
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/app/globals.css`에서 `--accent: #3ecf8e`와 Step 1의 원본 토큰들이 여전히 존재하는지 확인한다 (shadcn init이 덮어쓰지 않았는지 최종 확인).
3. `src/components/ui/*.tsx` 각 파일에서 raw hex나 Tailwind 기본 팔레트 색상 클래스(`slate`, `zinc`, `white`, `black` 등)를 직접 쓰지 않고 토큰 클래스(`bg-primary`, `text-foreground` 등)만 쓰는지 확인한다.
4. `phases/0-project-scaffolding/index.json`의 step 2 항목을 업데이트한다 (성공/error/blocked 처리는 Step 0과 동일한 규칙).

## 금지사항

- shadcn 컴포넌트 내부 구현을 임의로 재설계하지 마라(하드코딩된 색상을 토큰 클래스로 교체하는 것 외에는 손대지 않는다). 이유: `docs/DESIGN.md`가 "프로토타입 구현을 베끼지 않고 치수·색만 맞춘다"고 명시했다 — shadcn 원본에도 같은 원칙이 적용된다.
- `StatCard`, `TransactionRow`, `ProgressBar`, `AmountDisplay`, `LockVeil`, `InsightItem`, `PrivacyList`, `SectionHead`, `Wordmark`, `AppShell`/`Sidebar` 같은 도메인 컴포넌트를 만들지 마라. 이유: `docs/DESIGN.md`가 이들을 "직접 만든다" 목록으로 분류했고, 실제 데이터·라우트와 함께 만들어야 하므로 각 기능 task(대시보드, 업로드 등)의 몫이다.
- Recharts를 설치하거나 차트 컴포넌트를 만들지 마라. 이유: 별도 task이며 `docs/DESIGN.md`가 "차트 작업 전 `dataviz` 스킬을 반드시 로드할 것"을 요구한다.
- 기존 테스트를 깨뜨리지 마라.
