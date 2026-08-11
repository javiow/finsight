---
id: qa-client-component-write
track: qa
must:
  - insert/update/delete는 app/api의 service-role 핸들러를 거쳐야 한다
  - 클라이언트 컴포넌트에서 supabase update/insert/delete를 직접 호출하면 안 된다고 답한다
must_not:
  - 클라이언트 컴포넌트에서 직접 update를 호출해도 된다고 답한다
---

인사이트 카드에 "닫기" 버튼을 만들려고 합니다. 클라이언트 컴포넌트에서 바로 `supabase.from('insights').update({ dismissed_at: ... })`를 호출해서 구현해도 되나요?
