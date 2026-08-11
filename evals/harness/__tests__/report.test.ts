import { describe, expect, it } from "vitest";

import { buildReportData } from "../lib/report.ts";
import type { CaseResult, QaCase, ReviewCase } from "../lib/types.ts";

const review: ReviewCase = {
  track: "review",
  id: "review-1",
  expect: "violation",
  rule: "외부 API 호출은 app/api 라우트 핸들러 안에서만 한다",
  prompt: "코드 스니펫",
  sourcePath: "cases/review/1.md",
};

const qa: QaCase = {
  track: "qa",
  id: "qa-1",
  must: ["사실 하나"],
  mustNot: ["틀린 주장"],
  falsePremise: true,
  prompt: "질문 본문",
  sourcePath: "cases/qa/1.md",
};

const reviewResult: CaseResult = {
  caseId: "review-1",
  track: "review",
  pass: true,
  reasoning: "위반을 정확히 지적함",
  subjectResponse: "이 코드는 규칙을 위반합니다.",
};

const qaResult: CaseResult = {
  caseId: "qa-1",
  track: "qa",
  pass: false,
  reasoning: "must 사실 누락",
  subjectResponse: "잘 모르겠습니다.",
};

describe("buildReportData", () => {
  it("케이스와 결과를 id로 매칭해서 리포트 엔트리를 만든다", () => {
    const report = buildReportData([review, qa], [reviewResult, qaResult], "2026-08-11T00:00:00.000Z");

    expect(report.generatedAt).toBe("2026-08-11T00:00:00.000Z");
    expect(report.entries).toHaveLength(2);

    const reviewEntry = report.entries.find((e) => e.id === "review-1");
    expect(reviewEntry).toEqual({
      id: "review-1",
      track: "review",
      pass: true,
      reasoning: "위반을 정확히 지적함",
      prompt: "코드 스니펫",
      subjectResponse: "이 코드는 규칙을 위반합니다.",
      context: "외부 API 호출은 app/api 라우트 핸들러 안에서만 한다",
      falsePremise: false,
    });
  });

  it("qa 엔트리의 context는 must/must_not을 요약한 문자열이다", () => {
    const report = buildReportData([qa], [qaResult], "2026-08-11T00:00:00.000Z");
    const entry = report.entries[0];
    expect(entry.context).toContain("사실 하나");
    expect(entry.context).toContain("틀린 주장");
    expect(entry.falsePremise).toBe(true);
  });

  it("summary를 결과로부터 계산해서 포함한다", () => {
    const report = buildReportData([review, qa], [reviewResult, qaResult], "2026-08-11T00:00:00.000Z");
    expect(report.summary.overallPass).toBe(false);
    expect(report.summary.tracks.review).toEqual({ total: 1, passed: 1, failed: [] });
    expect(report.summary.tracks.qa).toEqual({ total: 1, passed: 0, failed: ["qa-1"] });
  });

  it("케이스에 대응하는 결과가 없으면 에러를 던진다", () => {
    expect(() => buildReportData([review], [], "2026-08-11T00:00:00.000Z")).toThrow(/review-1/);
  });
});
