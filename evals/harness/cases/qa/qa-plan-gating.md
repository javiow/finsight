---
id: qa-plan-gating
track: qa
must:
  - 플랜 게이팅(Pro 여부 판정)은 서버에서만 한다
  - src/lib/plan.ts의 requirePro가 실제 차단을 담당한다
  - 클라이언트 조건부 렌더는 UI 표시일 뿐 보안 경계가 아니다
must_not:
  - 클라이언트에서 user.plan 값을 확인해 버튼을 숨기는 것만으로 Pro 기능 보호가 충분하다고 답한다
---

프론트엔드 컴포넌트에서 `user.plan === 'pro'` 조건으로 버튼을 숨기기만 하면 Pro 전용 기능 보호로 충분한가요?
