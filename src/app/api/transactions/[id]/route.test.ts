// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getUserMock, createServerClientMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  createServerClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createServerClientMock,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";

import { PATCH } from "./route";

interface MockState {
  owned: boolean;
  merchantName: string;
  updatedTransaction: Record<string, unknown>;
  upserts: unknown[];
}

function createTransactionsChain(state: MockState) {
  const chain: Record<string, unknown> = {};
  let mode: "select" | "update" = "select";
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => {
    mode = "update";
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => void) => {
    if (mode === "select") {
      const data = state.owned
        ? { id: "txn-1", merchant_name: state.merchantName, user_id: "user-1" }
        : null;
      return Promise.resolve({ data, error: null }).then(resolve);
    }
    return Promise.resolve({ data: state.updatedTransaction, error: null }).then(resolve);
  };
  return chain;
}

function createUmcChain(state: MockState) {
  const chain: Record<string, unknown> = {};
  chain.upsert = vi.fn((rows: unknown) => {
    state.upserts.push(rows);
    return chain;
  });
  chain.then = (resolve: (value: unknown) => void) =>
    Promise.resolve({ data: null, error: null }).then(resolve);
  return chain;
}

function createServiceClientMock(overrides: Partial<MockState> = {}) {
  const state: MockState = {
    owned: true,
    merchantName: "cu 편의점",
    updatedTransaction: { id: "txn-1", category: "생활·마트" },
    upserts: [],
    ...overrides,
  };

  const from = vi.fn((table: string) => {
    if (table === "transactions") return createTransactionsChain(state);
    if (table === "user_merchant_categories") return createUmcChain(state);
    throw new Error(`unexpected table: ${table}`);
  });

  return { client: { from }, state };
}

function buildRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/transactions/txn-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function callRoute(body: unknown, id = "txn-1") {
  return PATCH(buildRequest(body), { params: Promise.resolve({ id }) });
}

describe("PATCH /api/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({ auth: { getUser: getUserMock } });
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("미인증이면 401을 반환한다", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);

    const response = await callRoute({ category: "생활·마트" });

    expect(response.status).toBe(401);
  });

  it("유효하지 않은 category 값이면 400을 반환한다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(createServiceClientMock().client as never);

    const response = await callRoute({ category: "존재하지않는카테고리" });

    expect(response.status).toBe(400);
  });

  it("다른 사용자 소유 거래면 403을 반환한다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock({ owned: false }).client as never,
    );

    const response = await callRoute({ category: "생활·마트" });

    expect(response.status).toBe(403);
  });

  it("정상 요청이면 갱신된 거래를 200으로 반환한다", async () => {
    const { client } = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    const response = await callRoute({ category: "생활·마트" });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: "txn-1", category: "생활·마트" });
  });

  it("user_merchant_categories에 source:'user'로 정규화된 가맹점명을 upsert한다", async () => {
    const { client, state } = createServiceClientMock({ merchantName: "cu   편의점" });
    vi.mocked(createServiceClient).mockReturnValue(client as never);

    await callRoute({ category: "생활·마트" });

    expect(state.upserts[0]).toEqual(
      expect.objectContaining({
        user_id: "user-1",
        merchant_name: "CU 편의점",
        category: "생활·마트",
        source: "user",
      }),
    );
  });
});
