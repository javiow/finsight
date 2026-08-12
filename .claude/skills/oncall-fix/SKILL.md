---
name: oncall-fix
description: CI(lint/build/test) 실패 로그만 읽어 근본 원인을 분석하고, oncall/ 브랜치에 최소 수정을 커밋해 PR을 여는 온콜 자동 수정 스킬. .github/workflows/oncall-ci-fix.yml이 CI 실패(workflow_run, conclusion=failure)를 감지했을 때만 호출한다 — 사람의 채팅 요청이 아니라 CI 실패 자체가 트리거다. master로 직접 push하거나 PR을 자동 머지하는 경로는 없다. 사람이 인터랙티브 세션에서 특정 CI 실패를 진단·수정해달라고 요청한 경우에도 같은 절차를 재사용할 수 있다.
---

# oncall-fix: CI 실패 자동 수정

목표는 "완벽한 수정"이 아니라 "사람이 검토할 수 있는 안전한 PR을 항상 만드는 것"이다. 확신이 없으면 8번(폴백)로 넘어가되, PR은 반드시 연다.

## 0. 안전 경계 (절대 어기지 않는다)

- **master에 직접 push하지 않는다.** 모든 변경은 `oncall/ci-fix-<run_id>` 브랜치 → PR 경로로만 나간다.
- **PR을 자동 머지하지 않는다.** `gh pr merge`, `--auto`, admin merge 등 어떤 형태로도 머지를 시도하지 않는다. 산출물은 항상 사람이 리뷰할 PR이다.
- `.github/workflows/`, `.claude/settings.json`, `.mcp.json`은 이 스킬이 직접 수정하지 않는다. CI 실패 원인이 이 파일들에 있어 보이면, 고치는 대신 PR 본문에 그 사실과 제안을 적고 사람 판단을 요청한다(자기 자신의 권한을 넓히거나 안전장치를 약화시키는 방향으로 수정할 유인을 아예 없앤다).
- `supabase/migrations/`에 파일을 추가하는 것은 허용되지만, 이 워크플로우에는 DB 자격 증명이 전달되지 않으므로 어떤 마이그레이션도 실행하지 않는다(실행할 수도 없다). 프로덕션 배포·DB에는 이 스킬이 닿을 수단이 없다.
- 로그는 실패한 스텝만 읽는다(1번). 전체 로그를 훑지 않는다.
- PR 본문·커밋 메시지에 시크릿으로 보이는 문자열(토큰, JWT, `postgres://user:pass@...` 형태의 연결 문자열, 32자 이상의 랜덤 영숫자 등)을 원문 그대로 인용하지 않는다. 언급이 필요하면 `[REDACTED]`로 치환한다.

## 1. 컨텍스트 파악 및 중복 체크

호출 프롬프트에 담긴 run id, run URL, head_sha, head_branch, 트리거 이벤트, 연관 PR JSON을 확인한다.

브랜치명은 `oncall/ci-fix-<run_id>`로 고정한다(run id는 GitHub UI에서 실패 job을 재실행해도 동일하게 유지되므로 자연히 멱등하다). 작업을 시작하기 전에 먼저 확인한다:

```
gh pr list --repo javiow/finsight --head oncall/ci-fix-<run_id> --state all --json number,url,state
```

이미 열려 있거나(open) 처리된(merged/closed) PR이 있으면 새로 작업하지 말고 그 사실만 보고하고 종료한다.

## 2. 실패한 job과 로그 확보

```
gh run view <run_id> --repo javiow/finsight --json jobs -q '.jobs[] | select(.conclusion=="failure") | .name'
gh run view <run_id> --repo javiow/finsight --log-failed
```

`--log-failed`만 쓴다(`--log` 금지) — 실패한 스텝의 로그만 가져와 시크릿 노출 면적과 컨텍스트 낭비를 동시에 줄인다.

## 3. 근본 원인 분석

- 로그에서 실패한 정확한 명령(`npm run lint`/`build`/`test` 중 무엇인지)과 에러 메시지(파일:라인, 타입 에러, assertion 실패 등)를 특정한다.
- `git log --oneline -5`와 `git show <head_sha>`로 이 커밋이 무엇을 바꿨는지 확인한다.
- 관련 소스 파일을 Read로 열어 실제로 무엇이 깨졌는지 확인한다 — 로그 메시지만 보고 추측하지 않는다.
- `CLAUDE.md`의 CRITICAL 규칙과 `docs/ARCHITECTURE.md`를 위반하지 않는 수정 방향인지 확인한다.

## 4. 수정 원칙

이 저장소의 `CLAUDE.md` 2·3번 원칙을 그대로 적용한다:

- 실패를 없애는 데 필요한 최소한의 변경만 한다. 인접 코드 스타일 개선, 관련 없는 리팩토링을 하지 않는다.
- 기존 코드 스타일을 따른다.
- 새 구현 파일이 필요하면 TDD Guard 훅(`scripts/hooks/tdd-guard.sh`)이 테스트 파일 부재 시 write를 막는다 — 우회하려 하지 말고 테스트를 먼저 작성한다.
- 변경된 모든 줄이 이번 CI 실패와 직접 연결되어야 한다.

## 5. 로컬 검증

push하기 전에 실패했던 스크립트를 로컬에서 반드시 재현·확인한다. `npm run build`가 필요하면 `ci.yml`과 동일한 더미 env를 준다:

```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=placeholder-posthog-token \
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com \
npm run build
```

가능하면 `npm run lint && npm run build && npm run test`를 모두 돌려 이번 수정이 다른 걸 깨뜨리지 않았는지 확인한다. **통과하지 않으면 push하지 않는다** — 8번(폴백)으로 넘어간다.

## 6. 브랜치·커밋·push

```
git checkout -b oncall/ci-fix-<run_id>
git add <변경된 파일만>
git commit -m "fix: <짧은 요약> (CI run #<run_id>)"
git push origin oncall/ci-fix-<run_id>
```

## 7. PR 생성

**base 브랜치 결정**: 연관 PR JSON에 항목이 있으면 그 PR의 head branch를 base로 잡는다(이 fix가 원래 PR에 합쳐지도록 — 원래 PR의 리뷰·머지 절차를 우회하지 않는다). 연관 PR이 없으면(직접 push로 발생한 실패 등) 저장소 기본 브랜치(`master`)를 base로 잡는다.

본문은 따옴표 이스케이프 문제를 피하기 위해 스크래치 파일에 먼저 작성한 뒤 `--body-file`로 넘긴다. 템플릿:

```markdown
## 무엇이 깨졌는가
- 실패 워크플로우: CI (run #<run_id>, <실패한 job 이름>)
- 실패 커밋: <head_sha> (`<head_branch>`)
- 실패 로그 요약: <에러 메시지 핵심, 원문 그대로가 아니라 필요한 부분만>

## 왜 깨졌는가
<근본 원인 — 어떤 변경이 무엇을 깨뜨렸는지>

## 어떻게 고쳤는가
<파일별 변경과 이유>

## 확인
- [x] 로컬에서 <lint/build/test 중 해당 항목> 통과 확인함
- 원본 실패 로그: <run URL>

---
이 PR은 CI 실패를 감지한 온콜 에이전트가 자동으로 생성했습니다. **자동으로 머지되지 않습니다** — 리뷰 후 직접 머지해 주세요. GITHUB_TOKEN으로 생성된 PR이라 CI가 자동으로 재실행되지 않을 수 있습니다. 머지 전 수동으로 재실행해 확인해 주세요.
```

```
gh pr create --repo javiow/finsight --base <base> --head oncall/ci-fix-<run_id> \
  --title "fix(ci): <짧은 요약> (run #<run_id>)" \
  --body-file <scratch-path>
```

`gh pr merge`는 절대 호출하지 않는다.

## 8. 폴백 — 확신이 없을 때

근본 원인이 불확실하거나(플레이키한 실패로 보임), 수정에 설계 판단이 필요하거나(스키마 변경, 의존성 메이저 업그레이드, 외부 서비스 문제로 보이는 경우), 5번 로컬 검증을 통과하는 수정을 찾지 못했다면:

`head_sha`를 되돌리는 revert로 대체한다 — 근본 수정보다 "CI를 그린으로 되돌리는 안전한 선택"을 우선한다.

```
git checkout -b oncall/ci-fix-<run_id>
git revert --no-edit <head_sha>
git push origin oncall/ci-fix-<run_id>
```

PR 본문 템플릿의 "왜 깨졌는가" 자리에 "root cause 미확정 — 원인 조사에 필요한 단서: ..."를 적고, "어떻게 고쳤는가" 자리에 "근본 수정 대신 <head_sha>를 revert해 CI를 그린 상태로 되돌렸습니다. 근본 원인 조사와 재작업이 필요합니다."라고 명시한다. revert도 실패(충돌 등)하면 코드 변경 없이 진단 내용만 담은 이슈를 대신 연다: `gh issue create --repo javiow/finsight --title "CI 실패 자동 수정 불가 (run #<run_id>)" --body-file <scratch-path>`.
