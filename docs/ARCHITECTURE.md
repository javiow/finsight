# 아키텍처

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx  ·  pricing/  ·  login/  ·  auth/callback/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx              # 인증 가드 + 셸
│   │   ├── dashboard/page.tsx      # 요약 · 차트 · 인사이트 · 업로드
│   │   ├── transactions/page.tsx
│   │   └── trends/page.tsx         # Pro
│   └── api/                        # 변경 · 외부 API 호출 전용
│       ├── statements/route.ts             # POST 업로드·파싱
│       ├── statements/[id]/classify/route.ts   # POST 분류 (반복 호출)
│       ├── transactions/[id]/route.ts      # PATCH 카테고리 수정
│       ├── insights/route.ts               # POST 인사이트
│       ├── checkout/  ·  portal/  ·  webhooks/polar/
│       └── cron/purge/route.ts             # 30일 지난 원본 삭제
├── components/        # UI 컴포넌트
├── types/             # database.ts (생성) · api.ts (계약)
├── lib/               # csv/ · plan.ts · supabase/
└── services/          # claude.ts — 외부 API 래퍼. 모델 ID 상수도 여기 하나
supabase/migrations/   # 스키마 · RLS · 인덱스
design/                # Claude Design 프로토타입 — 팔레트·컴포넌트 원본 (빌드 대상 아님)
```

`design/`은 애플리케이션 코드가 아니다. import하지 않으며 빌드·테스트에 포함되지 않는다. 디자인 판단의 참조 원본이다 — 무엇이 들어 있고 어떻게 이식하는지는 `docs/DESIGN.md`에 있다.

테이블은 다섯이다: `profiles` · `statements` · `transactions` · `user_merchant_categories` · `insights`.

## 패턴

**Server Components 기본.** 인터랙션이 필요한 곳(업로드 위젯, 차트, 필터, 카테고리 수정)만 Client Component로 내린다.

**읽기와 쓰기의 경로가 다르다.**

| | 경로 | 접근 제어 |
|---|---|---|
| 조회 | Server Component → `@supabase/ssr` 서버 클라이언트 → Postgres | RLS (`user_id = auth.uid()`) |
| 변경 | Client → `app/api/` 라우트 → service-role 클라이언트 → Postgres | 라우트가 세션 검증 후 소유권 확인 |
| 외부 API | `app/api/` 라우트 → Anthropic · Polar | 라우트 안에서만 |

조회를 API 라우트로 우회시키지 않는 이유는 SSR 이점을 버리지 않기 위해서다. 대신 브라우저의 `authenticated` 역할에서 INSERT/UPDATE/DELETE 권한을 revoke해, "변경은 API를 거친다"는 규칙을 DB 권한으로 강제한다.

**집계는 Server Component에서 JS로 한다.** 거래 테이블이 어차피 해당 기간 행을 읽으므로, 같은 결과를 `reduce`로 합산한다. 한 달 치가 수백 건인 규모에서 전용 RPC를 만들 이유가 없다. 한 화면이 느껴질 만큼 커지면 그때 넣는다.

**LLM 호출은 캐시 미스에서만.** 분류와 인사이트는 캐시를 먼저 조회하고 미스인 항목만 모델에 보낸다. 캐시 키는 전부 유저 스코프다(ADR-005).

| 경계 | 캐시 | 키 |
|---|---|---|
| LLM #2 분류 | `user_merchant_categories` | (user_id, 정규화 가맹점명) |
| LLM #3 인사이트 | `insights` | (user_id, 기간) |

매핑(LLM #1)은 캐시하지 않는다. 명세서당 1회, `effort: "low"`, 20행 미리보기라 호출당 비용이 무시할 수준이고 테이블을 하나 더 둘 값어치가 없다.

## 데이터 흐름

### 업로드 → 분석

```
① POST /api/statements                          (~15초, 단일 요청)
   업로드 → 검증(확장자·크기·행수·한도) → statements row 선생성
   → Storage 저장 → 인코딩 감지(UTF-8 실패 시 CP949) → papaparse
   → 미리보기 비식별화 → LLM #1 컬럼 인덱스 매핑 추론 → zod + 범위 검증
   → 전체 행 파싱(행 단위 스킵 허용) → transactions 배치 insert
   → 202 { statementId, status: 'classifying', pending, total }

② POST /api/statements/:id/classify              (~12초, 반복 호출)
   user_merchant_categories 조회 → 미스만 LLM #2 배치 분류(가맹점명 100개)
   → enum 검증 + 키 기반 매칭 → 캐시 upsert
   → category IS NULL 인 행만 UPDATE → 커밋 → 200 { pending, total }
   클라이언트가 pending 0이 될 때까지 반복 호출하며 진행률을 그린다

③ POST /api/insights                             (대시보드 요청 시)
   해당 기간 캐시 조회 → 미스면 집계 숫자만 LLM #3에 전송
   → Free는 preview 1개, Pro는 3개 생성·캐시
```

한 요청으로 처리하지 않는 이유는 타임아웃이 아니라 **진행률과 실패 재개**다. 배치마다 커밋되므로 중간에 죽어도 앞선 배치는 남고, 새로고침 후 이어서 재개된다.

②는 `category IS NULL`인 행만 건드리므로 자연히 멱등하다. 요청이 겹쳐도 결과가 깨지지 않으니 lease나 락을 두지 않는다(ADR-003).

### LLM 전송 경계

| | 보내는 것 | 보내지 않는 것 |
|---|---|---|
| LLM #1 (매핑) | 헤더 + 비식별화된 최대 20행. 미분류 컬럼은 값 대신 형태 요약(`숫자`·`날짜형`·`문자열`·`빈값`) | 원본 파일 바이트, 전체 행, 식별정보 값 |
| LLM #2 (분류) | 정규화된 가맹점명 배열 | 금액, 날짜, 카드번호 |
| LLM #3 (인사이트) | 카테고리별 합계·전월 대비·상위 가맹점 | 개별 거래 |

LLM #3은 개별 거래를 보지 못하므로 거래 ID를 인용할 수 없다. 대신 인사이트 스키마에 `category`와 `period`를 담고, UI가 그 조건으로 거래 테이블을 필터링해 보여준다. 사용자는 "식비가 32% 늘었다"의 근거를 확인할 수 있고 전송 경계는 유지된다.

### 결제

```
GET /api/checkout   세션에서 user id·email을 서버가 강제 주입
                    (클라이언트 쿼리 파라미터는 폐기 — 결제 귀속 조작 차단)
POST /api/webhooks/polar   서명 검증
                           → UPDATE ... WHERE modified_at < :eventModifiedAt
                           → profiles.plan 갱신
```

**웹훅이 구독 상태의 유일한 진실 원천이다.** successUrl 리디렉트만으로 plan을 올리지 않는다. `modified_at` 비교가 재전송과 순서 역전을 동시에 막으므로 이벤트 로그 테이블은 두지 않는다(ADR-007).

Polar는 샌드박스(`sandbox-api.polar.sh`)를 사용하며, 서명 검증은 `@polar-sh/nextjs`가 내부 처리한다.

## 상태 관리

- **서버 상태**는 Server Component가 요청마다 읽는다. 전역 스토어를 두지 않는다.
- **업로드 진행률**은 `classify` 응답의 `{ pending, total }`을 그대로 쓴다. 별도 폴링 라우트를 두지 않는다. 새로고침 후 재개는 Server Component가 `statements` 상태를 읽어 처리한다.
- `pending`은 DB 카운터가 아니라 `count(*) WHERE category IS NULL`로 매번 센다 — 카운터는 동시 요청에서 꼬인다.
- **클라이언트 로컬 상태**(필터, 모달, 폼)는 `useState`/`useReducer`로 충분하다.
- **테마 상태는 없다.** 다크 고정이므로 토글도 localStorage 유지도 두지 않는다.

## 플랜 게이팅

`src/lib/plan.ts`의 `getPlan` / `requirePro` 하나로 단일화한다. 클라이언트 조건부 렌더는 UI일 뿐이고, **차단은 항상 서버에서** 한다.
