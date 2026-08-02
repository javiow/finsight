// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

const { anthropicConstructorMock } = vi.hoisted(() => ({
  anthropicConstructorMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@anthropic-ai/sdk", () => ({
  default: anthropicConstructorMock,
}));

import {
  CLAUDE_MODEL,
  ClassificationError,
  ColumnMappingError,
  InsightGenerationError,
  classifyMerchants,
  createClaudeClient,
  generateInsights,
  mapColumns,
} from "./claude";
import type { MaskedPreview } from "@/lib/csv/preview";

function createParseClient(parseImpl: (...args: unknown[]) => unknown): Anthropic {
  return { messages: { parse: vi.fn(parseImpl) } } as unknown as Anthropic;
}

function createStreamClient(finalMessage: unknown): Anthropic {
  const streamMock = vi.fn().mockReturnValue({
    finalMessage: vi.fn().mockResolvedValue(finalMessage),
  });
  return { messages: { stream: streamMock } } as unknown as Anthropic;
}

describe("createClaudeClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-api-key";
  });

  it("ANTHROPIC_API_KEY로 Anthropic 클라이언트를 생성한다", () => {
    const client = {};
    anthropicConstructorMock.mockImplementation(() => client);

    expect(createClaudeClient()).toBe(client);
    expect(anthropicConstructorMock).toHaveBeenCalledWith({ apiKey: "test-api-key" });
  });
});

const preview: MaskedPreview = {
  headers: ["날짜", "가맹점", "금액"],
  columns: [
    { index: 0, header: "날짜", candidateSamples: ["2026-01-01"] },
    { index: 1, header: "가맹점", candidateSamples: ["스타벅스"] },
    { index: 2, header: "금액", candidateSamples: ["4500"] },
  ],
};

describe("mapColumns", () => {
  it("정상 응답이면 ColumnMapping을 반환하고 effort:low로 호출한다", async () => {
    const client = createParseClient(() => ({
      stop_reason: "end_turn",
      parsed_output: { dateColumnIndex: 0, merchantColumnIndex: 1, amountColumnIndex: 2 },
    }));

    const result = await mapColumns(client, preview);

    expect(result).toEqual({ dateColumnIndex: 0, merchantColumnIndex: 1, amountColumnIndex: 2 });
    const call = (client.messages.parse as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0][0] as { model: string; output_config: { effort: string } };
    expect(call.model).toBe(CLAUDE_MODEL);
    expect(call.output_config.effort).toBe("low");
  });

  it("stop_reason이 refusal이면 ColumnMappingError를 던진다", async () => {
    const client = createParseClient(() => ({ stop_reason: "refusal", parsed_output: null }));

    await expect(mapColumns(client, preview)).rejects.toBeInstanceOf(ColumnMappingError);
  });

  it("parsed_output이 없으면 ColumnMappingError를 던진다", async () => {
    const client = createParseClient(() => ({ stop_reason: "end_turn", parsed_output: null }));

    await expect(mapColumns(client, preview)).rejects.toBeInstanceOf(ColumnMappingError);
  });
});

describe("classifyMerchants", () => {
  it("요청한 가맹점명에 대한 분류 결과를 Map으로 반환한다", async () => {
    const client = createParseClient(() => ({
      stop_reason: "end_turn",
      parsed_output: {
        classifications: [
          { merchant: "스타벅스", category: "카페·간식" },
          { merchant: "GS25", category: "생활·마트" },
        ],
      },
    }));

    const result = await classifyMerchants(client, ["스타벅스", "GS25"]);

    expect(result.get("스타벅스")).toBe("카페·간식");
    expect(result.get("GS25")).toBe("생활·마트");
  });

  it("요청하지 않은 가맹점명이 응답에 있으면 무시한다", async () => {
    const client = createParseClient(() => ({
      stop_reason: "end_turn",
      parsed_output: {
        classifications: [
          { merchant: "스타벅스", category: "카페·간식" },
          { merchant: "미요청가맹점", category: "기타" },
        ],
      },
    }));

    const result = await classifyMerchants(client, ["스타벅스"]);

    expect(result.has("미요청가맹점")).toBe(false);
    expect(result.size).toBe(1);
  });

  it("요청했지만 응답에 없는 가맹점명은 결과 Map에서 빠진다", async () => {
    const client = createParseClient(() => ({
      stop_reason: "end_turn",
      parsed_output: { classifications: [{ merchant: "스타벅스", category: "카페·간식" }] },
    }));

    const result = await classifyMerchants(client, ["스타벅스", "GS25"]);

    expect(result.has("GS25")).toBe(false);
  });

  it("stop_reason이 refusal이면 ClassificationError를 던진다", async () => {
    const client = createParseClient(() => ({ stop_reason: "refusal", parsed_output: null }));

    await expect(classifyMerchants(client, ["스타벅스"])).rejects.toBeInstanceOf(
      ClassificationError,
    );
  });
});

describe("generateInsights", () => {
  const input = {
    period: "2026-01",
    categories: [{ category: "식비" as const, amount: 300000, prevAmount: 200000, count: 12 }],
    topMerchants: [{ merchant: "스타벅스", amount: 45000 }],
  };

  it("스트리밍 API(messages.stream)를 사용하고 messages.create는 쓰지 않는다", async () => {
    const finalMessage = {
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify({ insights: [{ category: "식비", message: "식비가 늘었어요" }] }),
        },
      ],
    };
    const client = createStreamClient(finalMessage);
    (client as unknown as { messages: { create: unknown } }).messages.create = vi.fn();

    await generateInsights(client, { ...input, count: 1 });

    expect(client.messages.stream).toHaveBeenCalled();
    expect(
      (client as unknown as { messages: { create: ReturnType<typeof vi.fn> } }).messages.create,
    ).not.toHaveBeenCalled();
  });

  it("count:1이면 인사이트 1개를 반환한다", async () => {
    const finalMessage = {
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify({ insights: [{ category: "식비", message: "식비가 늘었어요" }] }),
        },
      ],
    };
    const client = createStreamClient(finalMessage);

    const result = await generateInsights(client, { ...input, count: 1 });

    expect(result).toHaveLength(1);
  });

  it("count:3이면 인사이트 3개를 반환한다", async () => {
    const finalMessage = {
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify({
            insights: [
              { category: "식비", message: "a" },
              { category: "교통", message: "b" },
              { category: "쇼핑", message: "c" },
            ],
          }),
        },
      ],
    };
    const client = createStreamClient(finalMessage);

    const result = await generateInsights(client, { ...input, count: 3 });

    expect(result).toHaveLength(3);
  });

  it("stop_reason이 refusal이면 InsightGenerationError를 던진다", async () => {
    const client = createStreamClient({ stop_reason: "refusal", content: [] });

    await expect(generateInsights(client, { ...input, count: 1 })).rejects.toBeInstanceOf(
      InsightGenerationError,
    );
  });
});
