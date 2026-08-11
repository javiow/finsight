import { describe, expect, it } from "vitest";

import type { ChatClient } from "../lib/anthropicClient.ts";
import { SUBJECT_MODEL } from "../lib/models.ts";
import { runReviewSubject } from "../subjects/reviewSubject.ts";
import type { ReviewCase } from "../lib/types.ts";

const reviewCase: ReviewCase = {
  track: "review",
  id: "review-fixture",
  expect: "violation",
  rule: "규칙",
  prompt: "이 코드를 검토하라",
  sourcePath: "cases/review/fixture.md",
};

function fakeClient(responseText: string): { client: ChatClient; calls: unknown[] } {
  const calls: unknown[] = [];
  const client: ChatClient = {
    messages: {
      create: async (params) => {
        calls.push(params);
        return { content: [{ type: "text", text: responseText }] };
      },
    },
  };
  return { client, calls };
}

describe("runReviewSubject", () => {
  it("SUBJECT_MODEL, temperature 0, 시스템 프롬프트, 케이스 본문으로 요청을 구성한다", async () => {
    const { client, calls } = fakeClient("위반 없음");
    await runReviewSubject(client, "너는 리뷰어다", reviewCase);

    expect(calls).toEqual([
      {
        model: SUBJECT_MODEL,
        max_tokens: 1024,
        temperature: 0,
        system: "너는 리뷰어다",
        messages: [{ role: "user", content: "이 코드를 검토하라" }],
      },
    ]);
  });

  it("응답의 text 블록을 반환한다", async () => {
    const { client } = fakeClient("이 코드는 CRITICAL 규칙을 위반합니다.");
    const result = await runReviewSubject(client, "시스템", reviewCase);
    expect(result).toBe("이 코드는 CRITICAL 규칙을 위반합니다.");
  });
});
