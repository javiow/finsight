import { describe, expect, it } from "vitest";

import type { ChatClient } from "../lib/anthropicClient.ts";
import { SUBJECT_MODEL } from "../lib/models.ts";
import { buildQaSystemPrompt, runQaSubject } from "../subjects/qaSubject.ts";
import type { QaCase } from "../lib/types.ts";

const qaCase: QaCase = {
  track: "qa",
  id: "qa-fixture",
  must: ["사실"],
  mustNot: [],
  falsePremise: false,
  prompt: "질문 본문",
  sourcePath: "cases/qa/fixture.md",
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

describe("buildQaSystemPrompt", () => {
  it("CLAUDE.md 본문을 포함하고 전제 정정 지시를 담는다", () => {
    const prompt = buildQaSystemPrompt("## 아키텍처 규칙\n- CRITICAL: 규칙");
    expect(prompt).toContain("## 아키텍처 규칙");
    expect(prompt).toContain("전제");
  });
});

describe("runQaSubject", () => {
  it("SUBJECT_MODEL, temperature 0으로 CLAUDE.md를 시스템 프롬프트에 담아 요청한다", async () => {
    const { client, calls } = fakeClient("답변");
    await runQaSubject(client, "CLAUDE.md 본문", qaCase);

    const call = calls[0] as {
      model: string;
      temperature: number;
      system: string;
      messages: { role: string; content: string }[];
    };
    expect(call.model).toBe(SUBJECT_MODEL);
    expect(call.temperature).toBe(0);
    expect(call.system).toContain("CLAUDE.md 본문");
    expect(call.messages).toEqual([{ role: "user", content: "질문 본문" }]);
  });

  it("응답의 text 블록을 반환한다", async () => {
    const { client } = fakeClient("정답 텍스트");
    const result = await runQaSubject(client, "CLAUDE.md 본문", qaCase);
    expect(result).toBe("정답 텍스트");
  });
});
