import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";

import { validateGoldenSet, summarize } from "./lib/aggregate.ts";
import { extractCriticalRules } from "./lib/claudeMd.ts";
import { loadGoldenSet } from "./lib/loadCases.ts";
import { buildReportData } from "./lib/report.ts";
import type { Case, CaseResult, JudgeVerdict, Track } from "./lib/types.ts";
import { judgeQa, judgeReview, type JudgeClient } from "./judge/judge.ts";
import { runQaSubject } from "./subjects/qaSubject.ts";
import { runReviewSubject } from "./subjects/reviewSubject.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HARNESS_ROOT = __dirname;
const PROJECT_ROOT = path.resolve(HARNESS_ROOT, "..", "..");

export function filterByTrack(cases: readonly Case[], track: string | undefined): Case[] {
  if (!track) return [...cases];
  if (track !== "review" && track !== "qa") {
    throw new Error(`알 수 없는 track 필터: "${track}" (review 또는 qa만 가능합니다)`);
  }
  return cases.filter((c) => c.track === track);
}

export function buildReviewSystemPrompt(claudeMdContent: string): string {
  return [
    "너는 FinSight 코드베이스의 CLAUDE.md CRITICAL 규칙만 확인하는 경량 리뷰어다.",
    "아래 규칙에 근거해서만 판단하고, 위반이 있으면 어떤 규칙을 왜 위반했는지 명시하라.",
    "위반이 없으면 위반이 없다고 명확히 답하라. 규칙에 없는 것을 추측해서 지적하지 마라.",
    "",
    ...extractCriticalRules(claudeMdContent).map((rule) => `- ${rule}`),
  ].join("\n");
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));
  } catch {
    // .env.local이 없으면 이미 export된 환경 변수를 그대로 사용한다.
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY가 설정되어 있지 않습니다.");
    process.exitCode = 1;
    return;
  }

  const claudeMd = readFileSync(path.join(PROJECT_ROOT, "CLAUDE.md"), "utf-8");
  const reviewSystemPrompt = buildReviewSystemPrompt(claudeMd);

  const trackFilter = process.argv[2];
  const cases = filterByTrack(loadGoldenSet(path.join(HARNESS_ROOT, "cases")), trackFilter);

  const issues = validateGoldenSet(cases);
  if (issues.length > 0) {
    console.error("골든셋 무결성 검증 실패:");
    for (const issue of issues) console.error(`  - ${issue.message}`);
    process.exitCode = 1;
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // client.messages.parse()의 반환 타입은 넘겨준 zod 스키마로부터 제네릭 추론되는데,
  // JudgeClient는 그 스키마를 모르는 구조적 인터페이스라 자동으로 맞춰지지 않는다.
  // 이 어댑터 하나에만 캐스팅을 격리한다 — 실제 형태는 judge.ts의 verdictSchema가 보장한다.
  const judgeClient: JudgeClient = {
    messages: {
      parse: async (params) => {
        const response = await client.messages.parse(params);
        return {
          parsed_output: response.parsed_output as JudgeVerdict | null,
          stop_reason: response.stop_reason,
        };
      },
    },
  };

  const results: CaseResult[] = [];

  for (const c of cases) {
    process.stdout.write(`[${c.track}] ${c.id} ... `);

    if (c.track === "review") {
      const response = await runReviewSubject(client, reviewSystemPrompt, c);
      const verdict = await judgeReview(judgeClient, c, response);
      results.push({
        caseId: c.id,
        track: "review",
        pass: verdict.pass,
        reasoning: verdict.reasoning,
        subjectResponse: response,
      });
      console.log(verdict.pass ? "PASS" : `FAIL — ${verdict.reasoning}`);
    } else {
      const response = await runQaSubject(client, claudeMd, c);
      const verdict = await judgeQa(judgeClient, c, response);
      results.push({
        caseId: c.id,
        track: "qa",
        pass: verdict.pass,
        reasoning: verdict.reasoning,
        subjectResponse: response,
      });
      console.log(verdict.pass ? "PASS" : `FAIL — ${verdict.reasoning}`);
    }
  }

  const summary = summarize(results);
  console.log("");
  for (const track of ["review", "qa"] as Track[]) {
    const t = summary.tracks[track];
    if (t.total > 0) console.log(`${track}: ${t.passed}/${t.total} passed`);
  }
  console.log(summary.overallPass ? "\n전체 통과" : "\n실패한 케이스가 있습니다.");

  const reportData = buildReportData(cases, results, new Date().toISOString());
  const resultsDir = path.join(HARNESS_ROOT, "results");
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(path.join(resultsDir, "latest.json"), JSON.stringify(reportData, null, 2));
  console.log(`\n결과 저장: ${path.join(resultsDir, "latest.json")}`);

  if (!summary.overallPass) {
    process.exitCode = 1;
  }
}

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main();
}
