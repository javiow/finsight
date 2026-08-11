import { summarize } from "./aggregate.ts";
import type { Case, CaseReportEntry, CaseResult, ReportData } from "./types.ts";

function buildContext(c: Case): string {
  if (c.track === "review") {
    return c.rule;
  }
  const must = `must: ${c.must.join(" / ")}`;
  const mustNot = c.mustNot.length ? ` | must not: ${c.mustNot.join(" / ")}` : "";
  return must + mustNot;
}

export function buildReportData(
  cases: readonly Case[],
  results: readonly CaseResult[],
  generatedAt: string,
): ReportData {
  const resultById = new Map(results.map((r) => [r.caseId, r]));

  const entries: CaseReportEntry[] = cases.map((c) => {
    const result = resultById.get(c.id);
    if (!result) {
      throw new Error(`케이스 "${c.id}"에 대한 결과가 없습니다.`);
    }
    return {
      id: c.id,
      track: c.track,
      pass: result.pass,
      reasoning: result.reasoning,
      prompt: c.prompt,
      subjectResponse: result.subjectResponse,
      context: buildContext(c),
      falsePremise: c.track === "qa" ? c.falsePremise : false,
    };
  });

  return {
    generatedAt,
    summary: summarize(results),
    entries,
  };
}
