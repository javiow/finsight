import { describe, expect, it } from "vitest";

import { buildReviewSystemPrompt, filterByTrack } from "../run.ts";
import type { Case, QaCase, ReviewCase } from "../lib/types.ts";

const review: ReviewCase = {
  track: "review",
  id: "r1",
  expect: "violation",
  rule: "규칙",
  prompt: "코드",
  sourcePath: "cases/review/r1.md",
};

const qa: QaCase = {
  track: "qa",
  id: "q1",
  must: ["사실"],
  mustNot: [],
  falsePremise: false,
  prompt: "질문",
  sourcePath: "cases/qa/q1.md",
};

describe("filterByTrack", () => {
  const cases: Case[] = [review, qa];

  it("track이 없으면 전체 케이스를 반환한다", () => {
    expect(filterByTrack(cases, undefined)).toEqual(cases);
  });

  it("review로 필터링하면 review 케이스만 남는다", () => {
    expect(filterByTrack(cases, "review")).toEqual([review]);
  });

  it("qa로 필터링하면 qa 케이스만 남는다", () => {
    expect(filterByTrack(cases, "qa")).toEqual([qa]);
  });

  it("알 수 없는 track이면 에러를 던진다", () => {
    expect(() => filterByTrack(cases, "bogus")).toThrow(/bogus/);
  });
});

describe("buildReviewSystemPrompt", () => {
  it("CLAUDE.md의 CRITICAL 규칙을 시스템 프롬프트에 나열한다", () => {
    const claudeMd = ["- CRITICAL: 규칙 하나", "- 일반 규칙", "- CRITICAL: 규칙 둘"].join("\n");
    const prompt = buildReviewSystemPrompt(claudeMd);
    expect(prompt).toContain("CRITICAL: 규칙 하나");
    expect(prompt).toContain("CRITICAL: 규칙 둘");
    expect(prompt).not.toContain("일반 규칙");
  });
});
