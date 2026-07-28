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
│   │   ├── trends/page.tsx         # Pro
│   │   └── settings/page.tsx
│   └── api/                        # 변경 · 외부 API 호출 전용
│       ├── statements/route.ts  ·  statements/[id]/route.ts
│       ├── statements/[id]/classify/route.ts
│       ├── transactions/[id]/route.ts
│       ├── insights/route.ts
│       ├── checkout/  ·  portal/  ·  webhooks/polar/
│       ├── cron/purge/route.ts
│       └── account/delete/route.ts
├── components/        # UI 컴포넌트
├── types/             # database.ts (생성) · api.ts (계약)
├── lib/               # csv/ · aggregate.ts · plan.ts · supabase/
└── services/          # claude.ts — 외부 API 래퍼
supabase/migrations/   # 스키마 · RLS · 인덱스 · RPC
```

## 패턴

**Server Components 기본.** 인터랙션이 필요한 곳(업로드 위젯, 차트, 필터, 카테고리 수정)만 Client Component로 내린다.

**읽기와 쓰기의 경로가 다르다.**

| | 경로 | 접근 제어 |
|---|---|---|
| 조회 | Server Component → `@supabase/ssr` 서버 클라이언트 → Postgres | RLS (`user_id = auth.uid()`) |
| 변경 | Client → `app/api/` 라우트 → service-role 클라이언트 → Postgres | 라우트가 세션 검증 후 소유권 확인 |
| 외부 API | `app/api/` 라우트 → Anthropic · Polar | 라우트 안에서만 |

조회를 API 라우트로 우회시키지 않는 이유는 SSR 이점을 버리지 않기 위해서다. 대신 브라우저의 `authenticated` 역할에서 INSERT/UPDATE/DELETE 권한을 revoke해, "변경은 API를 거친다"는 규칙을 DB 권한으로 강제한다.

**집계는 DB에서.** `lib/aggregate.ts`는 raw SQL을 클라이언트로 보내지 않고, migration에 정의한 security-invoker RPC(`get_dashboard_summary`)를 호출한다. 10,000건을 내려받아 클라이언트에서 합산하지 않는다.

## 데이터 흐름

### 업로드 → 분석 (2단계로 나뉜다)

```
① POST /api/statements                          (~15초, 단일 요청)
   업로드 → 검증(확장자·크기·행수·해시·한도) → statements row 선생성
   → Storage 저장 → 인코딩 감지(UTF-8 실패 시 CP949) → papaparse
   → 미리보기 비식별화 → LLM #1 컬럼 인덱스 매핑 추론 → zod + 범위 검증
   → 전체 행 파싱(행 단위 스킵 허용) → transactions 배치 insert
   → 202 { statementId, status: 'classifying', ... }

② POST /api/statements/:id/classify              (~12초, 배치 반복)
   statement lease를 원자적으로 claim한 요청만 진행
   → user_merchant_categories 조회 → 미스만 LLM #2 배치 분류(가맹점명 100개)
   → enum 검증 + 키 기반 매칭 → 캐시 upsert → transactions UPDATE
   → 배치 커밋 → 200 { pending, total }
   클라이언트가 pending 0이 될 때까지 반복 호출하며 진행률을 그린다

③ POST /api/insights                             (대시보드 요청 시)
   집계 숫자만 LLM #3에 전송 → Free는 preview 1개, Pro는 3개 생성·캐시
```

한 방 요청으로 처리하지 않는 이유는 타임아웃이 아니라 **진행률과 실패 재개**다. 배치마다 커밋되므로 중간에 죽어도 앞선 배치는 남고, 새로고침 후 이어서 재개된다.

### LLM 전송 경계

| | 보내는 것 | 보내지 않는 것 |
|---|---|---|
| LLM #1 (매핑) | 헤더 + 비식별화된 최대 20행. 미분류 컬럼은 값 대신 형태 요약(`숫자 8자리` 등) | 원본 파일 바이트, 전체 행, 식별정보 값 |
| LLM #2 (분류) | 정규화된 가맹점명 배열 | 금액, 날짜, 카드번호 |
| LLM #3 (인사이트) | 카테고리별 합계·전월 대비·상위 가맹점 | 개별 거래 |

### 결제

```
GET /api/checkout   세션에서 user id·email을 서버가 강제 주입
                    (클라이언트 쿼리 파라미터는 폐기 — 결제 귀속 조작 차단)
POST /api/webhooks/polar   서명 검증 → 멱등 → modified_at이 더 최신일 때만 반영
                           → profiles.plan 갱신
```

**웹훅이 구독 상태의 유일한 진실 원천이다.** successUrl 리디렉트만으로 plan을 올리지 않는다.

## 상태 관리

- **서버 상태**는 Server Component가 요청마다 읽는다. 전역 스토어를 두지 않는다.
- **업로드 진행률**은 클라이언트가 `GET /api/statements/:id`를 폴링해 얻는다. `pending`은 DB 카운터가 아니라 `count(*) WHERE category IS NULL`로 매번 센다 — 카운터는 동시 요청에서 꼬인다.
- **분류 중복 방지**는 `statements`의 lease 토큰과 90초 만료로 한다. 두 탭이 동시에 폴링해도 lease를 얻은 요청만 LLM을 부른다.
- **클라이언트 로컬 상태**(필터, 모달, 폼)는 `useState`/`useReducer`로 충분하다.

## 플랜 게이팅

`src/lib/plan.ts`의 `getPlan` / `requirePro` 하나로 단일화한다. 클라이언트 조건부 렌더는 UI일 뿐이고, **차단은 항상 서버에서** 한다.
