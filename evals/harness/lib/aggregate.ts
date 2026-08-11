import type { Case, CaseResult, QaCase, ReviewCase, Summary, Track, ValidationIssue } from "./types.ts";

const MIN_REVIEW_VIOLATIONS = 4;
const MIN_REVIEW_PASS = 1;
const MIN_QA_FALSE_PREMISE = 1;

function isReviewCase(c: Case): c is ReviewCase {
  return c.track === "review";
}

function isQaCase(c: Case): c is QaCase {
  return c.track === "qa";
}

export function validateGoldenSet(cases: readonly Case[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const idCounts = new Map<string, number>();
  for (const c of cases) {
    idCounts.set(c.id, (idCounts.get(c.id) ?? 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({ message: `중복된 케이스 id: "${id}" (${count}회 등장)` });
    }
  }

  const reviewCases = cases.filter(isReviewCase);
  const qaCases = cases.filter(isQaCase);

  const violationCount = reviewCases.filter((c) => c.expect === "violation").length;
  if (violationCount < MIN_REVIEW_VIOLATIONS) {
    issues.push({
      message: `review 트랙의 violation 케이스가 부족합니다 (${violationCount}/${MIN_REVIEW_VIOLATIONS} 필요)`,
    });
  }

  const passCount = reviewCases.filter((c) => c.expect === "pass").length;
  if (passCount < MIN_REVIEW_PASS) {
    issues.push({
      message: `review 트랙의 오탐 방지용 pass 케이스가 부족합니다 (${passCount}/${MIN_REVIEW_PASS} 필요)`,
    });
  }

  for (const c of reviewCases) {
    if (!c.rule.trim()) {
      issues.push({ message: `${c.sourcePath}: rule이 비어 있습니다.` });
    }
  }

  const falsePremiseCount = qaCases.filter((c) => c.falsePremise).length;
  if (falsePremiseCount < MIN_QA_FALSE_PREMISE) {
    issues.push({
      message: `qa 트랙에 틀린 전제를 반박하는 케이스가 부족합니다 (${falsePremiseCount}/${MIN_QA_FALSE_PREMISE} 필요)`,
    });
  }

  for (const c of qaCases) {
    if (c.must.length === 0) {
      issues.push({ message: `${c.sourcePath}: must 사실이 최소 1개 필요합니다.` });
    }
    if (c.falsePremise && c.mustNot.length === 0) {
      issues.push({
        message: `${c.sourcePath}: false_premise 케이스는 must_not(전제를 그대로 수긍하지 않기)이 최소 1개 필요합니다.`,
      });
    }
  }

  return issues;
}

export function summarize(results: readonly CaseResult[]): Summary {
  const tracks: Record<Track, { total: number; passed: number; failed: string[] }> = {
    review: { total: 0, passed: 0, failed: [] },
    qa: { total: 0, passed: 0, failed: [] },
  };
  const failedDetails: { caseId: string; reasoning: string }[] = [];

  for (const r of results) {
    const bucket = tracks[r.track];
    bucket.total += 1;
    if (r.pass) {
      bucket.passed += 1;
    } else {
      bucket.failed.push(r.caseId);
      failedDetails.push({ caseId: r.caseId, reasoning: r.reasoning });
    }
  }

  const overallPass = results.length > 0 && results.every((r) => r.pass);

  return { overallPass, tracks, failedDetails };
}
