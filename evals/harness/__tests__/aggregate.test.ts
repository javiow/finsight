import { describe, expect, it } from "vitest";

import { summarize, validateGoldenSet } from "../lib/aggregate.ts";
import type { Case, CaseResult, QaCase, ReviewCase } from "../lib/types.ts";

function reviewCase(overrides: Partial<ReviewCase> = {}): ReviewCase {
  return {
    track: "review",
    id: "review-1",
    expect: "violation",
    rule: "규칙",
    prompt: "코드",
    sourcePath: "cases/review/1.md",
    ...overrides,
  };
}

function qaCase(overrides: Partial<QaCase> = {}): QaCase {
  return {
    track: "qa",
    id: "qa-1",
    must: ["사실"],
    mustNot: [],
    falsePremise: false,
    prompt: "질문",
    sourcePath: "cases/qa/1.md",
    ...overrides,
  };
}

function goldenSet(): Case[] {
  return [
    reviewCase({ id: "review-1", expect: "violation" }),
    reviewCase({ id: "review-2", expect: "violation" }),
    reviewCase({ id: "review-3", expect: "violation" }),
    reviewCase({ id: "review-4", expect: "violation" }),
    reviewCase({ id: "review-5", expect: "pass" }),
    qaCase({ id: "qa-1" }),
    qaCase({ id: "qa-2" }),
    qaCase({ id: "qa-3" }),
    qaCase({ id: "qa-4" }),
    qaCase({ id: "qa-5", falsePremise: true, mustNot: ["전제를 수긍한다"] }),
  ];
}

describe("validateGoldenSet", () => {
  it("균형 잡힌 골든셋은 이슈가 없다", () => {
    expect(validateGoldenSet(goldenSet())).toEqual([]);
  });

  it("review violation 케이스가 4개 미만이면 이슈를 낸다", () => {
    const cases = goldenSet().filter((c) => c.id !== "review-2");
    const issues = validateGoldenSet(cases);
    expect(issues.some((i) => /violation/.test(i.message))).toBe(true);
  });

  it("review pass(오탐 방지) 케이스가 없으면 이슈를 낸다", () => {
    const cases = goldenSet().filter((c) => c.id !== "review-5");
    const issues = validateGoldenSet(cases);
    expect(issues.some((i) => /pass/.test(i.message))).toBe(true);
  });

  it("qa에 false_premise 케이스가 없으면 이슈를 낸다", () => {
    const cases = goldenSet().map((c) =>
      c.id === "qa-5" ? { ...c, falsePremise: false } : c,
    ) as Case[];
    const issues = validateGoldenSet(cases);
    expect(issues.some((i) => /전제/.test(i.message))).toBe(true);
  });

  it("false_premise 케이스인데 must_not이 비어 있으면 이슈를 낸다", () => {
    const cases = goldenSet().map((c) => (c.id === "qa-5" ? { ...c, mustNot: [] } : c)) as Case[];
    const issues = validateGoldenSet(cases);
    expect(issues.some((i) => /qa\/1\.md|must_not/.test(i.message))).toBe(true);
  });

  it("중복 id가 있으면 이슈를 낸다", () => {
    const cases = [...goldenSet(), reviewCase({ id: "review-1" })];
    const issues = validateGoldenSet(cases);
    expect(issues.some((i) => /중복/.test(i.message))).toBe(true);
  });

  it("review 케이스의 rule이 비어 있으면 이슈를 낸다", () => {
    const cases = goldenSet().map((c) => (c.id === "review-1" ? { ...c, rule: "  " } : c)) as Case[];
    const issues = validateGoldenSet(cases);
    expect(issues.some((i) => /rule/.test(i.message))).toBe(true);
  });
});

describe("summarize", () => {
  function result(overrides: Partial<CaseResult> = {}): CaseResult {
    return {
      caseId: "c1",
      track: "review",
      pass: true,
      reasoning: "이유",
      subjectResponse: "응답",
      ...overrides,
    };
  }

  it("전부 통과하면 overallPass가 true다", () => {
    const summary = summarize([
      result({ caseId: "r1", track: "review", pass: true }),
      result({ caseId: "q1", track: "qa", pass: true }),
    ]);
    expect(summary.overallPass).toBe(true);
    expect(summary.tracks.review).toEqual({ total: 1, passed: 1, failed: [] });
    expect(summary.tracks.qa).toEqual({ total: 1, passed: 1, failed: [] });
  });

  it("하나라도 실패하면 overallPass가 false이고 failedDetails에 담긴다", () => {
    const summary = summarize([
      result({ caseId: "r1", track: "review", pass: true }),
      result({ caseId: "r2", track: "review", pass: false, reasoning: "위반을 놓침" }),
    ]);
    expect(summary.overallPass).toBe(false);
    expect(summary.tracks.review).toEqual({ total: 2, passed: 1, failed: ["r2"] });
    expect(summary.failedDetails).toEqual([{ caseId: "r2", reasoning: "위반을 놓침" }]);
  });

  it("결과가 비어 있으면 overallPass는 false다", () => {
    expect(summarize([]).overallPass).toBe(false);
  });
});
