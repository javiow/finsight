import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { JUDGE_MODEL } from "../lib/models.ts";
import type { JudgeVerdict, QaCase, ReviewCase } from "../lib/types.ts";

const verdictSchema = z.object({
  pass: z.boolean(),
  reasoning: z.string(),
});

export interface JudgeClient {
  messages: {
    parse(params: {
      model: string;
      max_tokens: number;
      output_config: { effort: "low"; format: ReturnType<typeof zodOutputFormat> };
      messages: { role: "user"; content: string }[];
    }): Promise<{ parsed_output: JudgeVerdict | null; stop_reason: string | null }>;
  };
}

export class JudgeError extends Error {}

async function judge(client: JudgeClient, prompt: string): Promise<JudgeVerdict> {
  const response = await client.messages.parse({
    model: JUDGE_MODEL,
    max_tokens: 1024,
    output_config: { effort: "low", format: zodOutputFormat(verdictSchema) },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new JudgeError("judge 모델이 채점 결과를 반환하지 않았습니다.");
  }

  return response.parsed_output;
}

export function buildReviewJudgePrompt(reviewCase: ReviewCase, subjectResponse: string): string {
  return [
    "너는 코드 리뷰어의 답변 품질을 채점하는 심사관이다.",
    `대상 CLAUDE.md 규칙: ${reviewCase.rule}`,
    `이 케이스의 기대값(expect): ${
      reviewCase.expect === "violation" ? "코드에 규칙 위반이 있다" : "코드에 규칙 위반이 없다(정상 패턴)"
    }`,
    "",
    "--- 리뷰어에게 주어진 코드/질문 ---",
    reviewCase.prompt,
    "",
    "--- 리뷰어의 응답 ---",
    subjectResponse,
    "",
    reviewCase.expect === "violation"
      ? "리뷰어가 위 CLAUDE.md 규칙의 위반을 정확히 지적했으면 pass=true, 위반을 놓쳤거나 엉뚱한 문제를 지적했으면 pass=false."
      : "리뷰어가 이 코드를 규칙 위반으로 잘못 지적(오탐)했으면 pass=false, 위반이 없다고 정확히 판단했으면 pass=true.",
    "reasoning에 판단 근거를 한두 문장으로 적어라.",
  ].join("\n");
}

export function buildQaJudgePrompt(qaCase: QaCase, subjectResponse: string): string {
  const mustLines = qaCase.must.map((m, i) => `${i + 1}. ${m}`).join("\n");
  const mustNotLines = qaCase.mustNot.length
    ? qaCase.mustNot.map((m, i) => `${i + 1}. ${m}`).join("\n")
    : "(없음)";

  const lines = ["너는 코드베이스 Q&A 응답의 사실 정확성을 채점하는 심사관이다."];
  if (qaCase.falsePremise) {
    lines.push(
      "이 질문에는 잘못된 전제가 포함되어 있다. 좋은 답변은 전제를 그대로 수긍하지 않고 정정해야 한다.",
    );
  }
  lines.push(
    "",
    "--- 질문 ---",
    qaCase.prompt,
    "",
    "--- 응답 ---",
    subjectResponse,
    "",
    "--- 응답에 반드시 포함되어야 하는 사실(must) ---",
    mustLines,
    "",
    "--- 응답에 포함되면 안 되는 주장(must_not) ---",
    mustNotLines,
    "",
    "must 항목을 모두 의미상 충족하고 must_not 항목을 하나도 주장하지 않았으면 pass=true, 그렇지 않으면 pass=false.",
    "reasoning에 어떤 항목이 충족/위반되었는지 한두 문장으로 적어라.",
  );

  return lines.join("\n");
}

export async function judgeReview(
  client: JudgeClient,
  reviewCase: ReviewCase,
  subjectResponse: string,
): Promise<JudgeVerdict> {
  return judge(client, buildReviewJudgePrompt(reviewCase, subjectResponse));
}

export async function judgeQa(
  client: JudgeClient,
  qaCase: QaCase,
  subjectResponse: string,
): Promise<JudgeVerdict> {
  return judge(client, buildQaJudgePrompt(qaCase, subjectResponse));
}
