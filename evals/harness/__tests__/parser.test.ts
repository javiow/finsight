import { describe, expect, it } from "vitest";

import { parseCase } from "../lib/parser.ts";

describe("parseCase — review 케이스", () => {
  it("정상 review frontmatter를 파싱한다", () => {
    const raw = [
      "---",
      "id: review-example",
      "track: review",
      "expect: violation",
      "rule: 외부 API 호출은 app/api 라우트 핸들러 안에서만 한다",
      "---",
      "",
      "```tsx",
      "'use client'",
      "```",
      "",
    ].join("\n");

    const result = parseCase(raw, "cases/review/example.md");

    expect(result).toEqual({
      track: "review",
      id: "review-example",
      expect: "violation",
      rule: "외부 API 호출은 app/api 라우트 핸들러 안에서만 한다",
      prompt: "```tsx\n'use client'\n```",
      sourcePath: "cases/review/example.md",
    });
  });

  it("expect가 violation/pass가 아니면 에러를 던진다", () => {
    const raw = [
      "---",
      "id: review-bad",
      "track: review",
      "expect: maybe",
      "rule: 아무 규칙",
      "---",
      "본문",
    ].join("\n");

    expect(() => parseCase(raw, "cases/review/bad.md")).toThrow(/violation|pass/);
  });

  it("rule이 없으면 에러를 던진다", () => {
    const raw = ["---", "id: review-no-rule", "track: review", "expect: pass", "---", "본문"].join(
      "\n",
    );

    expect(() => parseCase(raw, "cases/review/no-rule.md")).toThrow(/rule/);
  });
});

describe("parseCase — qa 케이스", () => {
  it("must/must_not 리스트와 false_premise 불리언을 파싱한다", () => {
    const raw = [
      "---",
      "id: qa-example",
      "track: qa",
      "must:",
      "  - 사실 하나",
      "  - 사실 둘",
      "must_not:",
      "  - 틀린 주장",
      "false_premise: true",
      "---",
      "",
      "질문 본문입니다.",
      "",
    ].join("\n");

    const result = parseCase(raw, "cases/qa/example.md");

    expect(result).toEqual({
      track: "qa",
      id: "qa-example",
      must: ["사실 하나", "사실 둘"],
      mustNot: ["틀린 주장"],
      falsePremise: true,
      prompt: "질문 본문입니다.",
      sourcePath: "cases/qa/example.md",
    });
  });

  it("must_not과 false_premise를 생략하면 각각 빈 배열과 false로 기본값이 채워진다", () => {
    const raw = [
      "---",
      "id: qa-minimal",
      "track: qa",
      "must:",
      "  - 사실 하나",
      "---",
      "질문",
    ].join("\n");

    const result = parseCase(raw, "cases/qa/minimal.md");

    expect(result.track).toBe("qa");
    if (result.track === "qa") {
      expect(result.mustNot).toEqual([]);
      expect(result.falsePremise).toBe(false);
    }
  });

  it("must가 없으면 에러를 던진다", () => {
    const raw = ["---", "id: qa-no-must", "track: qa", "---", "질문"].join("\n");

    expect(() => parseCase(raw, "cases/qa/no-must.md")).toThrow(/must/);
  });
});

describe("parseCase — 공통 검증", () => {
  it("frontmatter가 없으면 에러를 던진다", () => {
    expect(() => parseCase("본문만 있음", "cases/broken.md")).toThrow(/---/);
  });

  it("frontmatter를 닫지 않으면 에러를 던진다", () => {
    const raw = ["---", "id: x", "track: review"].join("\n");
    expect(() => parseCase(raw, "cases/broken.md")).toThrow();
  });

  it("본문이 비어 있으면 에러를 던진다", () => {
    const raw = ["---", "id: review-empty", "track: review", "expect: pass", "rule: 규칙", "---", ""].join(
      "\n",
    );
    expect(() => parseCase(raw, "cases/review/empty.md")).toThrow(/본문/);
  });

  it("알 수 없는 track이면 에러를 던진다", () => {
    const raw = ["---", "id: x", "track: unknown", "---", "본문"].join("\n");
    expect(() => parseCase(raw, "cases/broken.md")).toThrow(/track/);
  });

  it("id가 없으면 에러를 던진다", () => {
    const raw = ["---", "track: review", "expect: pass", "rule: 규칙", "---", "본문"].join("\n");
    expect(() => parseCase(raw, "cases/broken.md")).toThrow(/id/);
  });
});
