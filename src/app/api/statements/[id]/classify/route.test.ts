// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getUserMock,
  createServerClientMock,
  createClaudeClientMock,
  classifyMerchantsMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  createServerClientMock: vi.fn(),
  createClaudeClientMock: vi.fn(),
  classifyMerchantsMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createServerClientMock,
}));

vi.mock("@/services/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/claude")>();
  return {
    ...actual,
    createClaudeClient: createClaudeClientMock,
    classifyMerchants: classifyMerchantsMock,
  };
});

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";

import { POST } from "./route";

interface MockState {
  owned: boolean;
  pendingMerchants: string[];
  pendingCountAfter: number;
  totalCount: number;
  cached: { merchant_name: string; category: string }[];
  statementUpdates: unknown[];
  transactionUpdates: { category: string; merchantNames: string[] }[];
  upserts: unknown[][];
}

function createStatementsChain(state: MockState) {
  const chain: Record<string, unknown> = {};
  let mode: "select" | "update" = "select";
  chain.select = vi.fn(() => {
    mode = "select";
    return chain;
  });
  chain.update = vi.fn((patch: unknown) => {
    mode = "update";
    state.statementUpdates.push(patch);
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => void) => {
    if (mode === "select") {
      return Promise.resolve({ data: state.owned ? { id: "stmt-1" } : null, error: null }).then(
        resolve,
      );
    }
    return Promise.resolve({ data: null, error: null }).then(resolve);
  };
  return chain;
}

function createTransactionsChain(state: MockState) {
  const chain: Record<string, unknown> = {};
  let mode: "select-rows" | "select-count" | "update" = "select-rows";
  let isCalled = false;
  let inArgs: string[] = [];
  let updatePatch: { category: string } | undefined;

  chain.select = vi.fn((_cols?: string, opts?: { count?: string }) => {
    mode = opts?.count ? "select-count" : "select-rows";
    return chain;
  });
  chain.update = vi.fn((patch: { category: string }) => {
    mode = "update";
    updatePatch = patch;
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn((_col: string, values: string[]) => {
    inArgs = values;
    return chain;
  });
  chain.is = vi.fn(() => {
    isCalled = true;
    return chain;
  });
  chain.then = (resolve: (value: unknown) => void) => {
    if (mode === "select-rows") {
      return Promise.resolve({
        data: state.pendingMerchants.map((m) => ({ merchant_name: m })),
        error: null,
      }).then(resolve);
    }
    if (mode === "select-count") {
      const count = isCalled ? state.pendingCountAfter : state.totalCount;
      return Promise.resolve({ count, error: null }).then(resolve);
    }
    if (mode === "update" && updatePatch) {
      state.transactionUpdates.push({ category: updatePatch.category, merchantNames: inArgs });
      return Promise.resolve({ data: null, error: null }).then(resolve);
    }
    return Promise.resolve({ data: null, error: null }).then(resolve);
  };
  return chain;
}

function createUmcChain(state: MockState) {
  const chain: Record<string, unknown> = {};
  let mode: "select" | "upsert" = "select";
  chain.select = vi.fn(() => {
    mode = "select";
    return chain;
  });
  chain.upsert = vi.fn((rows: unknown[]) => {
    mode = "upsert";
    state.upserts.push(rows);
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
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
    owned: true,
    pendingMerchants: [],
    pendingCountAfter: 0,
    totalCount: 0,
    cached: [],
    statementUpdates: [],
    transactionUpdates: [],
    upserts: [],
    ...overrides,
  };

  const from = vi.fn((table: string) => {
    if (table === "statements") return createStatementsChain(state);
    if (table === "transactions") return createTransactionsChain(state);
    if (table === "user_merchant_categories") return createUmcChain(state);
    throw new Error(`unexpected table: ${table}`);
  });

  return { client: { from }, state };
}

function buildRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/statements/stmt-1/classify", {
    method: "POST",
  });
}

function callRoute(id = "stmt-1") {
  return POST(buildRequest(), { params: Promise.resolve({ id }) });
}

describe("POST /api/statements/[id]/classify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({ auth: { getUser: getUserMock } });
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createClaudeClientMock.mockReturnValue({});
  });

  it("미인증이면 401을 반환한다", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);

    const response = await callRoute();

    expect(response.status).toBe(401);
  });

  it("다른 사용자의 statement면 403을 반환한다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock({ owned: false }).client as never,
    );

    const response = await callRoute();

    expect(response.status).toBe(403);
  });

  it("모든 가맹점이 캐시에 있으면 classifyMerchants를 호출하지 않는다", async () => {
    const { client } = createServiceClientMock({
      pendingMerchants: ["스타벅스"],
      cached: [{ merchant_name: "스타벅스", category: "카페·간식" }],
      pendingCountAfter: 0,
      totalCount: 3,
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const response = await callRoute();

    expect(response.status).toBe(200);
    expect(classifyMerchantsMock).not.toHaveBeenCalled();
  });

  it("캐시 미스만 classifyMerchants에 넘기고 source:'ai'로 upsert한다", async () => {
    classifyMerchantsMock.mockResolvedValue(new Map([["신규가맹점", "기타"]]));
    const { client, state } = createServiceClientMock({
      pendingMerchants: ["스타벅스", "신규가맹점"],
      cached: [{ merchant_name: "스타벅스", category: "카페·간식" }],
      pendingCountAfter: 0,
      totalCount: 2,
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    await callRoute();

    expect(classifyMerchantsMock).toHaveBeenCalledWith(expect.anything(), ["신규가맹점"]);
    expect(state.upserts[0]).toEqual([
      expect.objectContaining({
        merchant_name: "신규가맹점",
        category: "기타",
        source: "ai",
      }),
    ]);
  });

  it("category IS NULL인 행만 대상으로 카테고리를 UPDATE한다", async () => {
    classifyMerchantsMock.mockResolvedValue(new Map());
    const { client, state } = createServiceClientMock({
      pendingMerchants: ["스타벅스"],
      cached: [{ merchant_name: "스타벅스", category: "카페·간식" }],
      pendingCountAfter: 0,
      totalCount: 1,
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    await callRoute();

    expect(state.transactionUpdates).toEqual([
      { category: "카페·간식", merchantNames: ["스타벅스"] },
    ]);
  });

  it("pending이 0이 되면 statement status를 ready로 업데이트한다", async () => {
    const { client, state } = createServiceClientMock({
      pendingMerchants: [],
      pendingCountAfter: 0,
      totalCount: 5,
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const response = await callRoute();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ pending: 0, total: 5 });
    expect(state.statementUpdates).toContainEqual({ status: "ready" });
  });

  it("pending이 남아있으면 statement status를 ready로 바꾸지 않는다", async () => {
    const { client, state } = createServiceClientMock({
      pendingMerchants: [],
      pendingCountAfter: 3,
      totalCount: 5,
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const response = await callRoute();

    const body = await response.json();
    expect(body).toEqual({ pending: 3, total: 5 });
    expect(state.statementUpdates).not.toContainEqual({ status: "ready" });
  });

  it("이미 pending이 0인 상태에서 재호출하면 LLM 호출 없이 즉시 응답한다(멱등)", async () => {
    const { client } = createServiceClientMock({
      pendingMerchants: [],
      pendingCountAfter: 0,
      totalCount: 5,
    });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const response = await callRoute();

    expect(classifyMerchantsMock).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body).toEqual({ pending: 0, total: 5 });
  });
});
