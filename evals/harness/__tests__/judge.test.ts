import { describe, expect, it } from "vitest";

import {
  buildQaJudgePrompt,
  buildReviewJudgePrompt,
  JudgeError,
  judgeQa,
  judgeReview,
  type JudgeClient,
} from "../judge/judge.ts";
import { JUDGE_MODEL } from "../lib/models.ts";
import type { JudgeVerdict, QaCase, ReviewCase } from "../lib/types.ts";

const reviewCase: ReviewCase = {
  track: "review",
  id: "review-fixture",
  expect: "violation",
  rule: "외부 API 호출은 app/api 라우트 핸들러 안에서만 한다",
  prompt: "코드 스니펫",
  sourcePath: "cases/review/fixture.md",
};

const qaCase: QaCase = {
  track: "qa",
  id: "qa-fixture",
  must: ["카테고리는 (유저, 가맹점명) 키로 캐싱한다"],
  mustNot: ["모든 응답을 동일하게 캐싱한다"],
  falsePremise: false,
  prompt: "캐싱 키는 무엇인가?",
  sourcePath: "cases/qa/fixture.md",
};

function fakeJudgeClient(
  verdict: JudgeVerdict | null,
  stop_reason = "end_turn",
): { client: JudgeClient; calls: unknown[] } {
  const calls: unknown[] = [];
  const client: JudgeClient = {
    messages: {
      parse: async (params) => {
        calls.push(params);
        return { parsed_output: verdict, stop_reason };
      },
    },
  };
  return { client, calls };
}

describe("buildReviewJudgePrompt", () => {
  it("rule, expect 의미, 케이스 본문, subject 응답을 모두 포함한다", () => {
    const prompt = buildReviewJudgePrompt(reviewCase, "이 코드는 문제 없습니다.");
    expect(prompt).toContain(reviewCase.rule);
    expect(prompt).toContain(reviewCase.prompt);
    expect(prompt).toContain("이 코드는 문제 없습니다.");
    expect(prompt).toContain("위반");
  });
});

describe("buildQaJudgePrompt", () => {
  it("must/must_not 항목과 질문/응답을 모두 포함한다", () => {
    const prompt = buildQaJudgePrompt(qaCase, "카테고리는 (유저, 가맹점명)으로 캐싱합니다.");
    expect(prompt).toContain("카테고리는 (유저, 가맹점명) 키로 캐싱한다");
    expect(prompt).toContain("모든 응답을 동일하게 캐싱한다");
    expect(prompt).toContain(qaCase.prompt);
  });

  it("false_premise 케이스면 전제 정정 지시를 포함한다", () => {
    const prompt = buildQaJudgePrompt({ ...qaCase, falsePremise: true }, "답변");
    expect(prompt).toContain("전제");
  });
});

describe("judgeReview / judgeQa", () => {
  it("JUDGE_MODEL로 요청하고 parsed_output을 반환한다", async () => {
    const { client, calls } = fakeJudgeClient({ pass: true, reasoning: "정확히 지적함" });
    const verdict = await judgeReview(client, reviewCase, "위반입니다");

    expect(verdict).toEqual({ pass: true, reasoning: "정확히 지적함" });
    expect((calls[0] as { model: string }).model).toBe(JUDGE_MODEL);
  });

  it("qa 채점도 동일하게 동작한다", async () => {
    const { client } = fakeJudgeClient({ pass: false, reasoning: "필수 사실 누락" });
    const verdict = await judgeQa(client, qaCase, "모릅니다");
    expect(verdict).toEqual({ pass: false, reasoning: "필수 사실 누락" });
  });

  it("parsed_output이 없으면 JudgeError를 던진다", async () => {
    const { client } = fakeJudgeClient(null);
    await expect(judgeReview(client, reviewCase, "응답")).rejects.toThrow(JudgeError);
  });

  it("stop_reason이 refusal이면 JudgeError를 던진다", async () => {
    const { client } = fakeJudgeClient({ pass: true, reasoning: "무시됨" }, "refusal");
    await expect(judgeQa(client, qaCase, "응답")).rejects.toThrow(JudgeError);
  });
});
