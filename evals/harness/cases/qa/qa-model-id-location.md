---
id: qa-model-id-location
track: qa
must:
  - AI 모델 ID는 src/services/claude.ts의 상수 하나로 관리한다
  - 호출부(다른 API 라우트 등)에 모델 문자열을 직접 흩뿌리면 안 된다
must_not:
  - 각 API 라우트 파일마다 모델 이름 문자열을 따로 적어도 된다고 답한다
---

새 API 라우트에서 Claude를 호출하려고 합니다. 모델 이름 문자열("claude-opus-5")을 그 라우트 파일에 바로 적어도 되나요, 아니면 다른 곳을 참조해야 하나요?
