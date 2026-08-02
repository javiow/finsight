import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { CATEGORIES } from "@/lib/categories";
import type { ColumnMapping } from "@/lib/csv/rows";
import type { MaskedPreview } from "@/lib/csv/preview";
import type { Category } from "@/types/database";

export const CLAUDE_MODEL = "claude-opus-5";

export function createClaudeClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export class ColumnMappingError extends Error {}
export class ClassificationError extends Error {}
export class InsightGenerationError extends Error {}

function buildMappingPrompt(preview: MaskedPreview): string {
  const lines = preview.columns.map((column) =>
    column.candidateSamples
      ? `${column.index}. "${column.header}" 샘플: ${column.candidateSamples.join(", ")}`
      : `${column.index}. "${column.header}" 형태: ${column.shape}`,
  );

  return [
    "다음은 카드 명세서 CSV의 헤더와 컬럼별 미리보기다.",
    ...lines,
    "",
    "날짜, 가맹점명, 금액에 해당하는 컬럼의 인덱스를 각각 찾아라.",
  ].join("\n");
}

export async function mapColumns(
  client: Anthropic,
  preview: MaskedPreview,
): Promise<ColumnMapping> {
  const indexSchema = z.number().int().min(0).max(preview.headers.length - 1);
  const schema = z
    .object({
      dateColumnIndex: indexSchema,
      merchantColumnIndex: indexSchema,
      amountColumnIndex: indexSchema,
    })
    .refine(
      (mapping) =>
        new Set([
          mapping.dateColumnIndex,
          mapping.merchantColumnIndex,
          mapping.amountColumnIndex,
        ]).size === 3,
      "세 컬럼 인덱스는 서로 달라야 합니다.",
    );

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: buildMappingPrompt(preview) }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new ColumnMappingError("컬럼 매핑에 실패했습니다.");
  }

  return response.parsed_output;
}

export async function classifyMerchants(
  client: Anthropic,
  merchantNames: string[],
): Promise<Map<string, Category>> {
  const schema = z.object({
    classifications: z.array(
      z.object({
        merchant: z.string(),
        category: z.enum(CATEGORIES),
      }),
    ),
  });

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    messages: [
      {
        role: "user",
        content: `다음 가맹점명을 12개 카테고리 중 하나로 분류하라.\n\n${merchantNames.join("\n")}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new ClassificationError("가맹점 분류에 실패했습니다.");
  }

  const requested = new Set(merchantNames);
  const result = new Map<string, Category>();
  for (const item of response.parsed_output.classifications) {
    if (requested.has(item.merchant)) {
      result.set(item.merchant, item.category);
    }
  }
  return result;
}

export interface CategoryAggregate {
  category: Category;
  amount: number;
  prevAmount: number;
  count: number;
}

export interface InsightGenerationInput {
  period: string;
  categories: CategoryAggregate[];
  topMerchants: { merchant: string; amount: number }[];
  count: 1 | 3;
}

export interface GeneratedInsight {
  category: Category;
  message: string;
}

function buildInsightsPrompt(input: InsightGenerationInput): string {
  const categoryLines = input.categories.map(
    (c) => `${c.category}: 이번 달 ${c.amount}원(${c.count}건), 지난달 ${c.prevAmount}원`,
  );
  const merchantLines = input.topMerchants.map((m) => `${m.merchant}: ${m.amount}원`);

  return [
    `${input.period} 지출 데이터를 바탕으로 인사이트 ${input.count}개를 생성하라.`,
    "카테고리별 집계:",
    ...categoryLines,
    "상위 가맹점:",
    ...merchantLines,
  ].join("\n");
}

export async function generateInsights(
  client: Anthropic,
  input: InsightGenerationInput,
): Promise<GeneratedInsight[]> {
  const schema = z.object({
    insights: z
      .array(z.object({ category: z.enum(CATEGORIES), message: z.string() }))
      .length(input.count),
  });

  const stream = client.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    output_config: { format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: buildInsightsPrompt(input) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new InsightGenerationError("인사이트 생성에 실패했습니다.");
  }

  const textBlock = message.content.find(
    (block: { type: string }): block is Anthropic.TextBlock => block.type === "text",
  );
  if (!textBlock) {
    throw new InsightGenerationError("인사이트 생성에 실패했습니다.");
  }

  const parsed = schema.safeParse(JSON.parse(textBlock.text));
  if (!parsed.success) {
    throw new InsightGenerationError("인사이트 생성에 실패했습니다.");
  }

  return parsed.data.insights;
}
