// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getUserMock,
  createServerClientMock,
  getPlanMock,
  createClaudeClientMock,
  generateInsightsMock,
  reportServerErrorMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  createServerClientMock: vi.fn(),
  getPlanMock: vi.fn(),
  createClaudeClientMock: vi.fn(),
  generateInsightsMock: vi.fn(),
  reportServerErrorMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createServerClientMock,
}));

vi.mock("@/lib/plan", () => ({
  getPlan: getPlanMock,
}));

vi.mock("@/lib/posthog/server", () => ({
  reportServerError: reportServerErrorMock,
}));

vi.mock("@/services/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/claude")>();
  return {
    ...actual,
    createClaudeClient: createClaudeClientMock,
    generateInsights: generateInsightsMock,
  };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";

import { POST } from "./route";

interface MockState {
  maxDateRows: { transaction_date: string }[];
  rangeRows: { category: string; amount: number; merchant_name: string; transaction_date: string }[];
  cached: { category: string; period: string; message: string }[];
  upserts: unknown[][];
}

function createTransactionsChain(state: MockState) {
  const chain: Record<string, unknown> = {};
  let mode: "max-date" | "range" = "max-date";
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => {
    mode = "max-date";
    return chain;
  });
  chain.limit = vi.fn(() => chain);
  chain.gte = vi.fn(() => {
    mode = "range";
    return chain;
  });
  chain.lt = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => void) => {
    if (mode === "max-date") {
      return Promise.resolve({ data: state.maxDateRows, error: null }).then(resolve);
    }
    return Promise.resolve({ data: state.rangeRows, error: null }).then(resolve);
  };
  return chain;
}

function createInsightsChain(state: MockState) {
  const chain: Record<string, unknown> = {};
  let mode: "select" | "upsert" = "select";
  chain.select = vi.fn(() => {
    mode = "select";
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.upsert = vi.fn((rows: unknown[]) => {
    mode = "upsert";
    state.upserts.push(rows);
    return chain;
  });
  chain.then = (resolve: (value: unknown) => void) => {
    if (mode === "select") {
      return Promise.resolve({ data: state.cached, error: null }).then(resolve);
    }
    return Promise.resolve({ data: null, error: null }).then(resolve);
  };
  return chain;
}

function createServiceClientMock(overrides: Partial<MockState> = {}) {
  const state: MockState = {
    maxDateRows: [{ transaction_date: "2026-01-15" }],
    rangeRows: [
      { category: "식비", amount: 30000, merchant_name: "스타벅스", transaction_date: "2026-01-10" },
    ],
    cached: [],
    upserts: [],
    ...overrides,
  };

  const from = vi.fn((table: string) => {
    if (table === "transactions") return createTransactionsChain(state);
    if (table === "insights") return createInsightsChain(state);
    throw new Error(`unexpected table: ${table}`);
  });

  return { client: { from }, state };
}

function callRoute() {
  return POST();
}

describe("POST /api/insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({ auth: { getUser: getUserMock } });
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getPlanMock.mockResolvedValue("free");
    createClaudeClientMock.mockReturnValue({});
    generateInsightsMock.mockResolvedValue([{ category: "식비", message: "식비가 늘었어요" }]);
  });

  it("미인증이면 401을 반환한다", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);

    const response = await callRoute();

    expect(response.status).toBe(401);
  });

  it("거래가 0건이면 빈 배열을 반환하고 generateInsights를 호출하지 않는다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock({ maxDateRows: [] }).client as never,
    );

    const response = await callRoute();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
    expect(generateInsightsMock).not.toHaveBeenCalled();
  });

  it("캐시가 목표 개수만큼 있으면 generateInsights 없이 캐시를 반환한다", async () => {
    const cached = [{ category: "식비", period: "2026-01", message: "캐시된 인사이트" }];
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock({ cached }).client as never,
    );

    const response = await callRoute();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(cached);
    expect(generateInsightsMock).not.toHaveBeenCalled();
  });

  it("Free 플랜은 캐시 미스 시 count:1로 generateInsights를 호출한다", async () => {
    getPlanMock.mockResolvedValue("free");
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);

    const response = await callRoute();

    expect(generateInsightsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ count: 1 }),
    );
    const body = await response.json();
    expect(body).toHaveLength(1);
  });

  it("Pro 플랜은 캐시 미스 시 count:3으로 generateInsights를 호출한다", async () => {
    getPlanMock.mockResolvedValue("pro");
    generateInsightsMock.mockResolvedValue([
      { category: "식비", message: "a" },
      { category: "교통", message: "b" },
      { category: "쇼핑", message: "c" },
    ]);
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);

    const response = await callRoute();

    expect(generateInsightsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ count: 3 }),
    );
    const body = await response.json();
    expect(body).toHaveLength(3);
  });

  it("generateInsights 호출 인자는 카테고리 집계·상위 가맹점만 담고 개별 거래 필드가 없다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);

    await callRoute();

    const input = generateInsightsMock.mock.calls[0][1];
    expect(input).toHaveProperty("categories");
    expect(input).toHaveProperty("topMerchants");
    expect(input.categories[0]).not.toHaveProperty("transaction_date");
    expect(input.categories[0]).not.toHaveProperty("merchant_name");
  });

  it("생성된 인사이트를 user_id,period,category 기준으로 upsert한다", async () => {
    const { client, state } = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    await callRoute();

    expect(state.upserts[0]).toEqual([
      expect.objectContaining({ user_id: "user-1", period: "2026-01", category: "식비" }),
    ]);
  });

  it("generateInsights가 예상치 못하게 실패하면 500을 반환하고 reportServerError로 보고한다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);
    const unexpected = new Error("claude timeout");
    generateInsightsMock.mockRejectedValue(unexpected);

    const response = await callRoute();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
    expect(reportServerErrorMock).toHaveBeenCalledWith(
      unexpected,
      expect.objectContaining({ route: "POST /api/insights", distinctId: "user-1" }),
    );
  });
});
