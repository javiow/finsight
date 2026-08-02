// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getUserMock, createServerClientMock, getPlanMock, createClaudeClientMock, mapColumnsMock } =
  vi.hoisted(() => ({
    getUserMock: vi.fn(),
    createServerClientMock: vi.fn(),
    getPlanMock: vi.fn(),
    createClaudeClientMock: vi.fn(),
    mapColumnsMock: vi.fn(),
  }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createServerClientMock,
}));

vi.mock("@/lib/plan", () => ({
  getPlan: getPlanMock,
}));

vi.mock("@/services/claude", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/claude")>();
  return {
    ...actual,
    createClaudeClient: createClaudeClientMock,
    mapColumns: mapColumnsMock,
  };
});

interface QueryState {
  op: "count" | "insert" | "update" | null;
}

function createStatementsChain(
  state: QueryState,
  opts: { uploadCount: number; onUpdate: (patch: unknown) => void },
) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn((_cols?: string, selectOpts?: { count?: string }) => {
    if (selectOpts?.count) state.op = "count";
    return chain;
  });
  chain.insert = vi.fn(() => {
    state.op = "insert";
    return chain;
  });
  chain.update = vi.fn((patch: unknown) => {
    state.op = "update";
    opts.onUpdate(patch);
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => void) => {
    if (state.op === "count") {
      return Promise.resolve({ count: opts.uploadCount, error: null }).then(resolve);
    }
    return Promise.resolve({ data: null, error: null }).then(resolve);
  };
  return chain;
}

function createTransactionsChain(onInsert: (rows: unknown[]) => void) {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn((rows: unknown[]) => {
    onInsert(rows);
    return chain;
  });
  chain.then = (resolve: (value: unknown) => void) =>
    Promise.resolve({ data: null, error: null }).then(resolve);
  return chain;
}

function createServiceClientMock(
  opts: { uploadCount?: number } = {},
) {
  const insertedTransactions: unknown[][] = [];
  const statementUpdates: unknown[] = [];
  const uploadMock = vi.fn().mockResolvedValue({ data: { path: "x" }, error: null });

  const from = vi.fn((table: string) => {
    if (table === "statements") {
      return createStatementsChain(
        { op: null },
        { uploadCount: opts.uploadCount ?? 0, onUpdate: (patch) => statementUpdates.push(patch) },
      );
    }
    if (table === "transactions") {
      return createTransactionsChain((rows) => insertedTransactions.push(rows));
    }
    throw new Error(`unexpected table: ${table}`);
  });

  return {
    client: {
      from,
      storage: { from: vi.fn(() => ({ upload: uploadMock })) },
    },
    insertedTransactions,
    statementUpdates,
    uploadMock,
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(),
}));

import { createServiceClient } from "@/lib/supabase/service";
import { ColumnMappingError } from "@/services/claude";

import { POST } from "./route";

function buildRequest(csv: string, filename = "statement.csv"): NextRequest {
  const formData = new FormData();
  formData.append("file", new File([csv], filename, { type: "text/csv" }));
  return new NextRequest("http://localhost:3000/api/statements", {
    method: "POST",
    body: formData,
  });
}

const VALID_CSV = [
  "날짜,가맹점,금액",
  "2026-01-01,스타벅스,4500",
  "2026-01-02,GS25,3200",
].join("\n");

const VALID_MAPPING = { dateColumnIndex: 0, merchantColumnIndex: 1, amountColumnIndex: 2 };

describe("POST /api/statements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getPlanMock.mockResolvedValue("free");
    createClaudeClientMock.mockReturnValue({});
    mapColumnsMock.mockResolvedValue(VALID_MAPPING);
  });

  it("미인증이면 401을 반환한다", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock().client as never,
    );

    const response = await POST(buildRequest(VALID_CSV));

    expect(response.status).toBe(401);
  });

  it("csv가 아닌 파일이면 400 INVALID_FILE_TYPE을 반환한다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock().client as never,
    );

    const response = await POST(buildRequest("hello", "statement.txt"));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_FILE_TYPE");
  });

  it("5MB를 초과하는 파일이면 400 FILE_TOO_LARGE를 반환한다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock().client as never,
    );
    const bigContent = "a".repeat(5 * 1024 * 1024 + 1);

    const response = await POST(buildRequest(bigContent));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("FILE_TOO_LARGE");
  });

  it("Free 플랜이 24시간 내 3건을 이미 업로드했으면 429 UPLOAD_LIMIT_EXCEEDED를 반환한다", async () => {
    vi.mocked(createServiceClient).mockReturnValue(
      createServiceClientMock({ uploadCount: 3 }).client as never,
    );

    const response = await POST(buildRequest(VALID_CSV));

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.code).toBe("UPLOAD_LIMIT_EXCEEDED");
  });

  it("정상 UTF-8 CSV 업로드 시 202와 pending===total을 반환하고 거래를 배치 insert한다", async () => {
    const service = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(service.client as never);

    const response = await POST(buildRequest(VALID_CSV));

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.status).toBe("classifying");
    expect(body.pending).toBe(2);
    expect(body.total).toBe(2);
    expect(service.insertedTransactions[0]).toHaveLength(2);
    expect(
      service.statementUpdates.some(
        (u) => (u as { status?: string }).status === "classifying",
      ),
    ).toBe(true);
  });

  it("CP949(EUC-KR) CSV의 한글 가맹점명을 올바르게 디코딩해서 insert한다", async () => {
    const service = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(service.client as never);
    // 헤더는 ASCII, 가맹점명만 EUC-KR 바이트("가" = 0xB0 0xA1)로 구성한다.
    // UTF-8 fatal 디코딩이 이 바이트에서 실패하므로 전체 버퍼가 EUC-KR로 폴백된다.
    const header = new TextEncoder().encode("date,merchant,amount\n2026-01-01,");
    const euckrGa = new Uint8Array([0xb0, 0xa1]);
    const rest = new TextEncoder().encode(",4500");
    const bytes = new Uint8Array([...header, ...euckrGa, ...rest]);
    const file = new File([bytes], "statement.csv", { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", file);
    const request = new NextRequest("http://localhost:3000/api/statements", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(202);
    const inserted = service.insertedTransactions[0] as { merchant_name: string }[];
    expect(inserted[0].merchant_name).toBe("가");
  });

  it("5,000행을 초과하면 400 ROW_LIMIT_EXCEEDED를 반환하고 statement를 failed 처리한다", async () => {
    const service = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(service.client as never);
    const rows = Array.from(
      { length: 5001 },
      (_, i) => `2026-01-01,가맹점${i},1000`,
    );
    const csv = ["날짜,가맹점,금액", ...rows].join("\n");

    const response = await POST(buildRequest(csv));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("ROW_LIMIT_EXCEEDED");
    expect(
      service.statementUpdates.some((u) => (u as { status?: string }).status === "failed"),
    ).toBe(true);
  });

  it("mapColumns가 실패하면 422 COLUMN_MAPPING_FAILED를 반환하고 statement를 failed 처리한다", async () => {
    const service = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(service.client as never);
    mapColumnsMock.mockRejectedValue(new ColumnMappingError("실패"));

    const response = await POST(buildRequest(VALID_CSV));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe("COLUMN_MAPPING_FAILED");
    expect(
      service.statementUpdates.some((u) => (u as { status?: string }).status === "failed"),
    ).toBe(true);
  });

  it("일부 행 파싱에 실패해도 나머지 행은 정상 처리되고 total이 그만큼 줄어든다", async () => {
    const service = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(service.client as never);
    const csv = [
      "날짜,가맹점,금액",
      "깨진날짜,스타벅스,4500",
      "2026-01-02,GS25,3200",
    ].join("\n");

    const response = await POST(buildRequest(csv));

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.total).toBe(1);
    expect(service.insertedTransactions[0]).toHaveLength(1);
  });

  it("전 행이 파싱에 실패하면 422 COLUMN_MAPPING_FAILED를 반환한다", async () => {
    const service = createServiceClientMock();
    vi.mocked(createServiceClient).mockReturnValue(service.client as never);
    const csv = ["날짜,가맹점,금액", "깨진날짜,스타벅스,미상금액"].join("\n");

    const response = await POST(buildRequest(csv));

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe("COLUMN_MAPPING_FAILED");
  });
});
