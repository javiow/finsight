# Step 4: db-schema

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — "디렉토리 구조"(테이블 5개 목록), "데이터 흐름" 전체, "패턴" 절
- `/docs/ADR.md` — ADR-002(RLS+revoke), ADR-003(락 없는 멱등 분류), ADR-005(유저별 캐시), ADR-006(source 컬럼), ADR-007(웹훅·modified_at), ADR-009(사용량 제한)
- `/docs/PRD.md` — "요금제", "프라이버시" 절

## 작업

`supabase/migrations/`에 SQL 마이그레이션 파일을 작성한다. 파일명은 타임스탬프 접두사로 실행 순서를 보장한다(예: `0001_initial_schema.sql`). 테이블 5개를 하나의 파일에 몰아도 되고 나눠도 되지만, 나눌 경우 파일명 순서로 의존관계(FK)가 깨지지 않게 한다.

### 테이블 (필수 컬럼 — 나머지 세부사항은 재량)

**`profiles`**
- `id uuid primary key references auth.users(id) on delete cascade`
- `plan text not null default 'free' check (plan in ('free','pro'))`
- `polar_customer_id text` — nullable, 웹훅이 채운다
- `modified_at timestamptz not null default now()` — ADR-007의 웹훅 재전송/순서 역전 방어(`WHERE modified_at < :eventModifiedAt`)가 이 컬럼에 의존한다
- `created_at timestamptz not null default now()`

**`statements`**
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `filename text not null`
- `storage_path text not null`
- `status text not null check (status in ('parsing','classifying','ready','failed'))`
- `row_count int`
- `created_at timestamptz not null default now()` — cron purge(30일 경과 원본 삭제)와 ADR-009 업로드 한도 집계(24시간 이내 건수)가 이 컬럼을 쓴다

**`transactions`**
- `id uuid primary key default gen_random_uuid()`
- `statement_id uuid not null references statements(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade` — 조회가 매번 `statements`를 조인하지 않도록 의도적으로 비정규화한다
- `transaction_date date not null`
- `merchant_name text not null`
- `amount numeric not null`
- `category text check (category in (아래 12개 카테고리))` — **nullable.** 분류 전에는 NULL이며, ADR-003의 멱등 분류(`WHERE category IS NULL`)가 이 컬럼에 의존한다. NOT NULL로 만들면 안 된다.
- `created_at timestamptz not null default now()`

**`user_merchant_categories`**
- `user_id uuid not null references auth.users(id) on delete cascade`
- `merchant_name text not null` — 정규화된 가맹점명
- `category text not null check (category in (아래 12개 카테고리))`
- `source text not null check (source in ('ai','user'))` — ADR-006: 사용자 수정은 `source='user'`로 저장되고, LLM 결과 upsert는 `WHERE source='ai'` 조건이 걸려 사용자 수정을 덮어쓰지 않는다
- `updated_at timestamptz not null default now()`
- `primary key (user_id, merchant_name)` — **복합키.** ADR-005가 전역 캐시가 아닌 유저별 캐시를 명시적으로 선택했으므로 `user_id`가 키에 반드시 포함되어야 한다.

**`insights`**
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `period text not null` — 예: `'2026-07'`
- `category text` — nullable (카테고리 무관 전체 요약형 인사이트도 있을 수 있다)
- `message text not null`
- `created_at timestamptz not null default now()`

**12개 카테고리** (모든 `category` 체크 제약과 이후 애플리케이션 코드에서 값 집합이 정확히 일치해야 한다 — `design/finsight-data.js` 출처):
`식비`, `생활·마트`, `쇼핑`, `주거·관리비`, `카페·간식`, `교통`, `문화·여가`, `교육`, `통신`, `여행·숙박`, `의료·건강`, `기타`

### RLS (ADR-002)

5개 테이블 모두:
1. `alter table <table> enable row level security;`
2. SELECT 정책만 만든다: `user_id = auth.uid()` 조건(`profiles`는 `id = auth.uid()`). `authenticated` 롤에 SELECT가 필요하면 `grant select on <table> to authenticated;`도 함께 건다(Supabase 기본 권한 상태를 확인해서 필요한 만큼만 준다).
3. **INSERT/UPDATE/DELETE 정책은 만들지 않는다.** 대신 `revoke insert, update, delete on <table> from authenticated;`로 권한 자체를 뺏는다. 이게 "변경은 `app/api/` 서비스 롤 경로만 거친다"는 규칙을 DB 권한으로 강제하는 방법이다(ADR-002).

## Acceptance Criteria

```bash
npm run build
npm test
```

(SQL 파일은 TS 빌드/테스트에 직접 걸리지 않지만, 이 커맨드로 다른 부분이 깨지지 않았음을 확인한다. 추가로 아래 "검증 절차"의 정적 검토가 이 step의 핵심 AC다.)

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 작성한 SQL 파일을 다시 읽고 다음을 확인한다 (실제 DB 연결 없이 정적 검토):
   - 5개 테이블 모두 `enable row level security`가 걸려 있는가?
   - 5개 테이블 모두 `authenticated`에서 insert/update/delete가 revoke됐는가?
   - `transactions.category`, `user_merchant_categories.category` 체크 제약이 위 12개 카테고리와 정확히 일치하는가(오타·누락 없이)?
   - `user_merchant_categories`의 primary key가 `(user_id, merchant_name)` 복합키인가?
   - `transactions.category`가 NOT NULL이 아닌가?
3. `phases/0-project-scaffolding/index.json`의 step 4 항목을 업데이트한다 (성공/error/blocked 처리는 Step 0과 동일한 규칙).

## 금지사항

- 이 5개 테이블 외의 테이블(사용량 카운터, 이벤트 로그 등)을 만들지 마라. 이유: ADR-009는 별도 사용량 집계 테이블을 만들지 않고 `statements.created_at`을 세는 방식을 택했고, ADR-007도 이벤트 로그 테이블 없이 `modified_at` 비교만으로 멱등성을 확보하기로 결정했다. 지금 테이블을 추가하면 그 결정을 무효화하는 것이다.
- 전역(사용자 무관) 가맹점 캐시 테이블을 만들지 마라. 이유: ADR-005가 프롬프트 인젝션 위험을 이유로 명시적으로 거부한 설계다.
- 실제 Supabase 프로젝트에 마이그레이션을 적용하는 명령(`supabase db push`, `supabase link` 등)을 실행하지 마라. 이유: 로컬 SQL 파일 작성까지가 이 step의 범위이며, 연결할 실제 프로젝트가 없다.
- `transactions`에 카드번호·계좌·연락처 등 식별정보 컬럼을 추가하지 마라. 이유: PRD "프라이버시" 절 — 날짜·가맹점·금액 세 가지만 추출하며 식별정보는 애초에 DB에 들어가지 않는다.
