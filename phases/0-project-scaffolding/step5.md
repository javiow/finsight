# Step 5: api-contract-types

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — "데이터 흐름" 절 전체(각 엔드포인트의 요청/응답), "LLM 전송 경계" 표
- `/docs/ADR.md` — ADR-008(API 계약을 코드보다 먼저 고정), ADR-007(웹훅/plan), ADR-009(사용량 제한)
- `/docs/PRD.md` — "요금제", "MVP 제외 사항"의 "컬럼 수동 지정 UI 없음 → 명확한 실패 안내로 대체" 부분
- `/CLAUDE.md` — "`src/types/api.ts`의 요청·응답 타입과 에러 코드가 API 계약의 유일한 출처다" 규칙
- Step 4에서 작성한 `supabase/migrations/*.sql` — 테이블 컬럼과 12개 카테고리 값을 정확히 옮겨야 한다.

## 작업

### `src/types/database.ts`

Step 4 마이그레이션의 5개 테이블과 1:1 대응하는 TypeScript 타입을 정의한다: `Profile`, `Statement`, `Transaction`, `UserMerchantCategory`, `Insight`.

```ts
export type Category =
  | '식비' | '생활·마트' | '쇼핑' | '주거·관리비' | '카페·간식' | '교통'
  | '문화·여가' | '교육' | '통신' | '여행·숙박' | '의료·건강' | '기타';
```

이 `Category` 유니온을 여기서 한 번만 정의하고, 이후 모든 코드(마이그레이션의 체크 제약, `api.ts`, 컴포넌트)가 이 타입을 참조한다.

### `src/types/api.ts`

`docs/ARCHITECTURE.md` "데이터 흐름"에 명시된 엔드포인트별 요청/응답 타입을 정의한다. 필드명은 문서에 나온 그대로 쓰고, 문서에 없는 필드(페이지네이션 등)는 지어내지 않는다. 최소한 다음을 포함한다:

- `POST /api/statements` 응답: `{ statementId: string; status: 'classifying'; pending: number; total: number }`
- `POST /api/statements/:id/classify` 응답: `{ pending: number; total: number }`
- `PATCH /api/transactions/:id` 요청: `{ category: Category }`
- `POST /api/insights` 응답: 인사이트 배열. 각 항목은 ARCHITECTURE.md "LLM 전송 경계" 절에 따라 `category`와 `period`를 참조로 들고 있어야 한다(LLM #3이 개별 거래를 못 보므로, UI가 이 필드로 거래 테이블을 필터링한다).
- checkout/portal/webhook 관련 타입은 최소한으로(예: 체크아웃 URL 응답 정도) — 실제 Polar SDK 타입과 겹치는 부분은 재정의하지 않는다.

**에러 코드**: `ApiErrorCode`를 as-const 유니온 또는 enum으로 정의하고, 코드→한국어 메시지 매핑 객체 `API_ERROR_MESSAGES: Record<ApiErrorCode, string>`을 함께 정의한다. 최소 다음 케이스를 포함한다:
- 컬럼 매핑 실패(LLM #1이 헤더를 인식하지 못함) — PRD "MVP 제외 사항"의 수동 지정 UI 대체물이므로 메시지가 사용자가 다음 행동(다른 카드사 포맷 확인 등)을 알 수 있을 만큼 구체적이어야 한다.
- 파일 형식/크기/행수 초과
- 업로드 한도 초과(ADR-009: Free 24시간 3건 / Pro 10건)
- 인증 실패 / 권한 없음(Pro 전용 기능을 Free가 요청)
- 서버 오류(예외 상황)

## Acceptance Criteria

```bash
npm run lint
npm run build
npm run test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. `src/types/database.ts`의 `Category` 유니온이 Step 4 SQL의 체크 제약과 정확히 같은 12개 값인지(순서 무관, 값 집합 일치) 대조한다.
3. `src/types/api.ts`의 응답 타입 필드명이 `docs/ARCHITECTURE.md` "데이터 흐름"에 적힌 이름과 일치하는지 확인한다.
4. `phases/0-project-scaffolding/index.json`의 step 5 항목을 업데이트한다. 이 step까지 완료되면 task 전체가 끝나므로, 다음도 함께 확인한다:
   - 성공 → step 5의 `status`를 `"completed"`로 표시
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 실제 API 라우트(`app/api/**/route.ts`)를 구현하지 마라. 이유: 이 task는 계약(타입)만 고정한다 — ADR-008이 "구현이 여러 세션으로 나뉘므로 계약을 먼저 고정한다"고 명시했고, 실제 구현은 각 기능 task(업로드·분류·대시보드·결제)의 몫이다.
- `supabase gen types`로 `database.ts`를 생성하려 시도하지 마라. 이유: 아직 실제 Supabase 프로젝트가 연결되지 않아 실행할 수 없다 — Step 4 SQL을 손으로 옮겨 적는다. 실제 프로젝트가 연결되면 그때 생성 방식으로 교체한다.
- ARCHITECTURE.md에 없는 필드명을 지어내지 마라. 이유: CLAUDE.md가 "새 필드명을 지어내지 말고 이 파일을 먼저 읽어라"를 CRITICAL로 규정했다 — 이 파일(`api.ts`)이 그 대상 자체이므로 특히 주의한다.
- 기존 테스트를 깨뜨리지 마라.
