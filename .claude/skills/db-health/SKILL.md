---
name: db-health
description: Supabase MCP의 get_advisors로 finsight DB(project_id kdseyvubflrknmlnshag)의 보안·성능 어드바이저 리포트를 받아온 뒤, 안전하고 되돌리기 쉬운 항목(RLS 정책의 auth 함수 재평가 최적화, 신규 인덱스 제안 등)은 supabase/migrations/에 마이그레이션 파일로 직접 작성하고, 위험하거나 판단이 필요한 항목(모든 security 권고, RLS 접근 제어 로직 변경, 컬럼/테이블 구조 변경, 권한 변경, 인덱스 삭제)은 근거와 함께 제안만 하고 사용자 승인을 기다리는 스킬. 실제 DB에는 절대 직접 적용하지 않으며 배포는 항상 사용자 몫이다. "/db-health", "DB 점검해줘", "데이터베이스 성능 점검해줘", "데이터베이스 보안 점검해줘", "Supabase advisor 확인해줘", "RLS 성능 최적화해줘" 같은 요청에 반드시 이 스킬을 트리거한다.
---

# db-health: Supabase 보안·성능 점검 및 안전한 자동 수정

Supabase advisor는 "이렇게 하면 좋다"는 신호일 뿐, 무엇을 자동으로 고치고 무엇을 사람 판단에 맡길지는 이 스킬이 책임진다. 핵심 원칙: **되돌리기 쉽고 접근 제어 의미가 바뀌지 않는 것만 자동, 나머지는 전부 제안**.

## 0. 대상 프로젝트

`project_id`는 항상 `kdseyvubflrknmlnshag`(finsight)로 고정한다. `.mcp.json`이 이미 이 프로젝트로 스코핑되어 있고 `read_only=true`로 제한되어 있지만, MCP 도구를 호출할 때도 매번 `project_id`를 명시적으로 지정해라 — 설정 파일에만 의존하지 말고 호출부에서도 이중으로 안전하게 만든다.

`read_only=true`이므로 이 스킬은 애초에 `apply_migration` 같은 쓰기 MCP 호출을 쓸 수 없다(호출해도 거부된다). 이건 설계와 일치한다 — 수정은 항상 로컬 파일로만 만든다(6번 참고). `execute_sql`은 읽기 전용 진단 쿼리(`pg_stat_user_tables`, `pg_stat_user_indexes` 조회 등)에만 쓴다.

## 1. 프로젝트 상태 확인

`mcp__supabase__get_project(id=kdseyvubflrknmlnshag)`로 상태를 확인한다.

- `ACTIVE_HEALTHY`면 바로 2번으로.
- `INACTIVE`(일시정지)면 advisor를 돌릴 수 없다. **조용히 재개하지 마라** — 재개(`restore_project`)는 상태를 바꾸는 행동이고 프로젝트 사용량/과금에 영향을 줄 수 있으니, 먼저 사용자에게 "프로젝트가 일시정지 상태인데 재개해도 될까요?"라고 확인받는다.
- 승인받으면 `restore_project(project_id=kdseyvubflrknmlnshag)` 호출 후 `get_project`로 상태를 폴링한다. `COMING_UP` → `RESTORING` → `ACTIVE_HEALTHY` 순으로 전이하며 보통 1~3분 걸린다. 짧은 sleep을 연쇄로 여러 번 부르지 말고, `Bash`를 `run_in_background: true`로 돌려서 대기하고 완료 알림을 받은 뒤 다시 확인하는 식으로 폴링해라.

## 2. Advisor 리포트 수집

두 카테고리 모두 실행한다:

- `mcp__supabase__get_advisors(project_id=kdseyvubflrknmlnshag, type=security)`
- `mcp__supabase__get_advisors(project_id=kdseyvubflrknmlnshag, type=performance)`

## 3. unused_index는 그대로 믿지 마라

performance 리포트에 `unused_index` 항목이 있으면, 삭제를 제안하기 전에 먼저 근거를 확인한다:

```sql
select relname as table_name, n_live_tup
from pg_stat_user_tables
where schemaname = 'public' and relname in (...unused_index가 걸린 테이블들...);
```

- row 수가 매우 적으면(기준: `n_live_tup`이 0이거나, 다른 테이블 대비 현저히 적은 수준 — 대략 수십 건 미만이면 통계적으로 유의미한 스캔이 애초에 일어나기 어렵다) `idx_scan=0`은 "중복 인덱스"가 아니라 "아직 이 인덱스를 탈 만한 쿼리가 실제로 실행된 적이 없다"는 뜻일 뿐이다. finsight는 포트폴리오/데모 앱이라 이 상황이 흔하다. 이런 경우 리포트에 "데이터가 적어 발생한 노이즈로 보이며 삭제를 권장하지 않음"이라고 명시하고, 5번의 "자동 적용" 그룹은 물론 "제안" 그룹에도 적극적으로 올리지 않는다 — 그냥 참고 정보로만 남긴다.
- row 수가 충분히 많은데도(수천 건 이상) `idx_scan=0`이면 진짜 불필요한 인덱스일 수 있다. 이때는 "제안" 그룹(4번)에 근거(row 수, idx_scan)와 함께 올린다.
- **인덱스 삭제는 근거가 얼마나 확실하든 항상 "제안만" 그룹이다.** 인덱스 추가는 실패해도 손해가 없지만(디스크만 좀 씀), 삭제는 나중에 쿼리가 갑자기 느려지는 형태로 뒤늦게 드러날 수 있어서 비대칭적으로 위험하다.

## 4. 자동 적용 vs 제안만 분류

**자동 적용 가능** (되돌리기 쉽고 접근 제어 의미가 바뀌지 않음):
- `auth_rls_initplan` — RLS 정책의 `auth.<fn>()` 호출을 `(select auth.<fn>())`로 감싸는 것. 권한 로직은 완전히 동일하고 순수 쿼리플랜 최적화다.
- advisor가 제안하는 **신규 인덱스 추가**(예: `index_advisor` 계열 권고가 있다면). 추가는 실패해도 되돌리기 쉽다.

**제안만, 승인 필요**:
- `security` 카테고리 전체. 보안 관련은 항상 사용자 판단이 필요하다고 본다 — 자동 적용 후보에 절대 넣지 않는다.
- RLS 정책의 **접근 제어 로직 자체**를 바꾸는 변경(누가 무엇을 볼 수 있는지가 달라지는 것).
- 컬럼/테이블 구조 변경(컬럼 삭제, 타입 변경, NOT NULL 추가 등) — 기존 데이터·앱 코드에 영향을 줄 수 있다.
- 권한(GRANT/REVOKE) 변경.
- 인덱스 삭제(3번 참고).

애매한 항목을 만나면 "이게 정말 되돌리기 쉽고 접근 제어 의미가 안 바뀌는가?"를 기준으로 판단하고, 확신이 없으면 제안만 그룹으로 넘겨라 — 자동 적용 쪽으로 무리해서 분류하지 않는다.

## 5. 리포트 작성

아래 구조를 그대로 따른다:

```
## Supabase Advisor 리포트 — finsight (kdseyvubflrknmlnshag)

### 🔒 Security — N건
{항목별로: 제목, 대상 테이블/객체, 설명, remediation 링크}

### ⚡ Performance — N건

**자동 적용 가능**
{항목별로: 제목, 대상, 왜 안전한지 한 줄, remediation 링크}

**제안만 (승인 필요)**
{항목별로: 제목, 대상, 왜 자동화하지 않는지 한 줄, remediation 링크}

**참고 (조치 불필요해 보임)**
{3번에서 노이즈로 판단한 unused_index 등}
```

항목이 하나도 없는 섹션은 "0건 — 클린합니다" 정도로 짧게 마무리한다.

## 6. 자동 적용 그룹 실행

"자동 적용 가능" 그룹에 실제 항목이 있을 때만:

1. `supabase/migrations/`를 나열해서 가장 큰 번호를 확인하고, 그다음 번호로 파일명을 정한다 (예: 기존 최대가 `0005`면 `0006_설명.sql`). **파일을 새로 만들기 전에** 기존 마이그레이션 파일들을 grep해서 같은 advisor 항목(예: 같은 테이블·정책 이름을 대상으로 한 `alter policy`)을 이미 고치는 파일이 없는지 확인해라 — 이전 실행에서 이미 만들어놓고 아직 배포만 안 한 파일이 있을 수 있다. 이미 있다면 새 파일을 또 만들지 말고, 리포트에 "이미 `000N`에서 처리됨 — 아직 미배포로 보임"이라고 알려주는 것으로 끝낸다.
2. 구체적인 SQL을 사용자에게 먼저 보여주고, `AskUserQuestion`으로 "파일 생성" vs "보류 — 코드만 먼저 검토" 중 선택받는다. 승인 없이 파일을 만들지 않는다. (`AskUserQuestion`을 쓸 수 없는 환경이면 채팅에 같은 두 선택지를 텍스트로 적어 물어보고 답을 기다려라 — 결정을 스킵하지 마라.)
3. 승인되면 `Write`로 `supabase/migrations/000N_설명.sql`을 생성한다. **`mcp__supabase__apply_migration`은 쓰지 않는다** — 원격에 즉시 반영하면 로컬 마이그레이션 이력과 어긋나는 drift가 생긴다. 이 스킬의 산출물은 항상 git으로 추적되는 로컬 파일이다.
4. 파일만 만들었고 실제 DB에는 적용되지 않았다는 것, 배포(`supabase db push` 등)는 사용자가 직접 해야 한다는 것을 분명히 알린다.

기존 파일 스타일(소문자 SQL 키워드, 2-space 들여쓰기, 세미콜론으로 문장 종료)을 따른다 — `supabase/migrations/`의 기존 파일을 한 번 읽어보고 맞춰라.

## 7. 제안만 그룹 처리

파일을 만들지 않는다. 각 항목마다 왜 자동화하지 않았는지(어떤 위험이 있는지)를 리포트에 이미 적었으니, 사용자가 원하면 그 항목에 한해 별도로 SQL 초안을 요청할 수 있다는 정도만 안내하고 끝낸다 — 먼저 나서서 만들지 않는다.

## 8. 마무리 요약

마지막에 한 줄 요약: "자동 적용 N건(파일 생성됨, 미배포) / 제안 N건(승인 대기) / 참고 N건(조치 불필요로 판단)".
