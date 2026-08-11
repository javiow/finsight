# eval harness

FinSight의 **비즈니스 로직이 아니라 "하네스 품질"**을 재는 eval이다. 즉 "카드 명세서를 잘 분류하는가"가
아니라 "이 저장소의 CLAUDE.md를 컨텍스트로 준 모델이, CLAUDE.md의 규칙을 실제로 지키고
정확하게 답하는가"를 검증한다.

## 두 트랙

| 트랙 | 무엇을 확인하는가 | 응답자(subject) | 채점(judge) |
|------|-------------------|------------------|--------------|
| `review` | 경량 리뷰어가 코드의 CLAUDE.md CRITICAL 규칙 위반을 잡아내는가 (위반 케이스) + 정상 패턴을 오탐하지 않는가 (pass 케이스) | Sonnet, temperature 0, 시스템 프롬프트 = CLAUDE.md에서 추출한 CRITICAL 규칙 요약 | Opus |
| `qa` | 응답자가 라이브 CLAUDE.md를 컨텍스트로 받아 코드베이스 질문(규약·예외처리·gotcha)에 사실대로 답하는가, 틀린 전제가 섞인 질문을 그대로 수긍하지 않고 반박하는가 | Sonnet, temperature 0, 시스템 프롬프트 = CLAUDE.md 전문 | Opus |

judge를 subject와 다른 모델(Opus)로 고정한 이유는 자기 채점 편향(같은 모델이 자기 응답을
관대하게 채점하는 경향)을 피하기 위해서다. `lib/models.ts`의 테스트가 두 모델이 다른지를
직접 검증한다.

## 디렉토리 구조

```
evals/harness/
  run.ts              # 회귀 게이트. 하나라도 fail이면 exit 1
  lib/                 # 순수 함수 (parser, aggregate, claudeMd, anthropicClient) + models.ts, loadCases.ts
  subjects/            # subject 호출 래퍼 (review/qa)
  judge/               # judge 호출 래퍼 + 프롬프트 빌더
  cases/
    review/*.md         # violation 4개 이상 + 오탐 방지용 pass 1개 이상
    qa/*.md              # must/must_not 사실 + 틀린 전제 반박 가드 1개 이상
  __tests__/            # vitest — 전부 키 없이 돈다
```

## 케이스 파일 형식

frontmatter(YAML 서브셋) + 본문(subject에게 그대로 전달되는 프롬프트).

**review 케이스**

```markdown
---
id: review-example
track: review
expect: violation   # 또는 pass
rule: 대상 CLAUDE.md CRITICAL 규칙 원문
---

검토 대상 코드/질문 (마크다운 자유 형식)
```

**qa 케이스**

```markdown
---
id: qa-example
track: qa
must:
  - 응답에 반드시 있어야 하는 사실 1
  - 응답에 반드시 있어야 하는 사실 2
must_not:            # 생략 가능, 기본값 []
  - 응답에 있으면 안 되는 주장
false_premise: true  # 생략 가능, 기본값 false. 질문의 전제 자체가 틀린 케이스
---

질문 본문
```

## Golden Set 원칙

- **작게 시작한다.** 지금은 review 5개(violation 4 + pass 1), qa 5개(일반 4 + 틀린 전제 반박 1)뿐이다.
  케이스 수를 늘리는 것보다 각 케이스가 실제로 판별력이 있는지(subject가 정말 틀릴 수 있는
  케이스인지)가 더 중요하다. 의미 없는 케이스를 채워 넣어 숫자를 부풀리지 않는다.
- **라벨은 사람이 박제한다.** `expect` / `must` / `must_not` / `false_premise`는 LLM이 생성한 게
  아니라 CLAUDE.md를 직접 읽고 사람이 판단해서 적은 값이다. LLM이 케이스도 만들고 라벨도
  매기면 judge와 케이스 작성자가 같은 편향을 공유하게 되어 회귀 게이트로서 의미가 없어진다.
  새 케이스를 추가할 때도 이 원칙을 지킨다 — LLM에게 케이스 초안을 시키더라도 `expect`/
  `must`/`must_not` 라벨은 사람이 CLAUDE.md 원문과 대조해서 직접 확정한다.
- **균형을 vitest가 강제한다.** `lib/aggregate.ts`의 `validateGoldenSet`이 review violation/pass
  최소 개수, qa의 틀린 전제 반박 케이스 존재 여부, 중복 id, 빈 규칙/사실 등을 체크한다.
  `npm test`가 이 검증을 실제 `cases/` 디렉토리에 대해 수행한다(`__tests__/loadCases.test.ts`).

## 순수 함수 vs 네트워크 — npm test / npm run eval 분리

- **`npm test` (vitest, 키 불필요)** — `lib/parser.ts`(frontmatter 파싱), `lib/aggregate.ts`
  (골든셋 무결성/균형 검증, 결과 집계), `lib/claudeMd.ts`(CRITICAL 규칙 추출)는 전부
  입력→출력만 있는 순수 함수라 실제 API 키 없이 테스트된다. `subjects/`와 `judge/`도 실제
  Anthropic 클라이언트 대신 fake client를 주입해 프롬프트 구성·응답 파싱 로직만 테스트한다
  (`ChatClient`/`JudgeClient` 인터페이스로 의존성을 주입받는 구조라 가능하다). 네트워크를
  타는 건 하나도 없다.
- **`npm run eval` (실제 API 호출, 비용 발생)** — `run.ts`만 실제 네트워크를 탄다. golden set을
  로드하고 → `validateGoldenSet`으로 무결성 재확인 → 각 케이스를 subject(Sonnet)에게 실행 →
  judge(Opus)로 채점 → 집계 후 하나라도 fail이면 `exit 1`. `.env.local`의
  `ANTHROPIC_API_KEY`를 사용한다.

```
npm run eval          # 전체 (review + qa)
npm run eval:review   # review 트랙만
npm run eval:qa       # qa 트랙만
```

## 새 케이스 추가하기

1. CLAUDE.md에서 확인하고 싶은 규칙/사실을 정한다.
2. `cases/review/` 또는 `cases/qa/`에 `.md` 파일을 추가한다. `id`는 파일 전체에서 유일해야 한다.
3. `expect`(review) 또는 `must`/`must_not`(qa) 라벨을 CLAUDE.md 원문과 대조해서 사람이 직접 적는다.
4. `npm test`로 골든셋 무결성 검증을 통과하는지 확인한다.
5. `npm run eval`로 실제로 subject가 이 케이스에서 통과/실패하는지 확인한다.
