import { describe, expect, it } from "vitest";

import { extractText } from "../lib/anthropicClient.ts";

describe("extractText", () => {
  it("text 블록들을 이어붙인다", () => {
    const text = extractText({
      content: [
        { type: "text", text: "첫 줄" },
        { type: "text", text: "둘째 줄" },
      ],
    });
    expect(text).toBe("첫 줄\n둘째 줄");
  });

  it("text가 아닌 블록은 무시한다", () => {
    const text = extractText({
      content: [
        { type: "thinking", text: "생각 과정" },
        { type: "text", text: "실제 답변" },
      ],
    });
    expect(text).toBe("실제 답변");
  });

  it("앞뒤 공백을 trim한다", () => {
    const text = extractText({ content: [{ type: "text", text: "  답변  " }] });
    expect(text).toBe("답변");
  });

  it("text 블록이 없으면 빈 문자열을 반환한다", () => {
    expect(extractText({ content: [] })).toBe("");
  });
});
