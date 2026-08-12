// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServiceClientMock, reportServerErrorMock } = vi.hoisted(() => ({
  createServiceClientMock: vi.fn(),
  reportServerErrorMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

vi.mock("@/lib/posthog/server", () => ({
  reportServerError: reportServerErrorMock,
}));

const VALID_SECRET = "test-webhook-secret";

const VALID_PAYLOAD = {
  event_id: "evt_123",
  alert_kind: "issue" as const,
  issue_id: "issue_abc",
  title: "TypeError: Cannot read properties of undefined",
  url: "https://us.posthog.com/project/1/error_tracking/issue_abc",
  occurred_at: "2026-08-12T10:00:00Z",
};

function buildRequest(body: unknown, secret: string | null = VALID_SECRET): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (secret !== null) headers.set("x-webhook-secret", secret);
  return new NextRequest("https://finsight.app/api/webhooks/posthog-alert", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function createAlertEventsChain(opts: {
  insertError: { code: string } | null;
  existingStatus?: "pending" | "dispatched";
}) {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn(() => Promise.resolve({ error: opts.insertError }));
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(() =>
    Promise.resolve({ data: opts.existingStatus ? { dispatch_status: opts.existingStatus } : null }),
  );
  chain.update = vi.fn(() => chain);
  return chain;
}

describe("POST /api/webhooks/posthog-alert", () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.POSTHOG_ALERT_WEBHOOK_SECRET = VALID_SECRET;
    process.env.GITHUB_DISPATCH_TOKEN = "test-gh-token";
    global.fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it("시크릿 헤더가 없으면 401을 반환하고 dispatch하지 않는다", async () => {
    const { POST } = await import("./route");
    const res = await POST(buildRequest(VALID_PAYLOAD, null));

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("시크릿이 틀리면 401을 반환한다", async () => {
    const { POST } = await import("./route");
    const res = await POST(buildRequest(VALID_PAYLOAD, "wrong-secret"));

    expect(res.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("payload 형식이 올바르지 않으면 400을 반환한다", async () => {
    const { POST } = await import("./route");
    const res = await POST(buildRequest({ event_id: "evt_1" }));

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("신규 이벤트면 event_id를 선삽입한 뒤 CI로 dispatch하고 202를 반환한다", async () => {
    const chain = createAlertEventsChain({ insertError: null });
    createServiceClientMock.mockReturnValue({ from: vi.fn(() => chain) });

    const { POST } = await import("./route");
    const res = await POST(buildRequest(VALID_PAYLOAD));

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: "evt_123", alert_kind: "issue" }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/javiow/finsight/dispatches",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-gh-token" }),
      }),
    );
    const dispatchedBody = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(dispatchedBody).toEqual({
      event_type: "posthog-alert",
      client_payload: VALID_PAYLOAD,
    });
    expect(chain.update).toHaveBeenCalledWith({ dispatch_status: "dispatched" });
    expect(res.status).toBe(202);
  });

  it("이미 dispatch된 event_id가 재전송되면 dispatch하지 않고 200을 반환한다", async () => {
    const chain = createAlertEventsChain({
      insertError: { code: "23505" },
      existingStatus: "dispatched",
    });
    createServiceClientMock.mockReturnValue({ from: vi.fn(() => chain) });

    const { POST } = await import("./route");
    const res = await POST(buildRequest(VALID_PAYLOAD));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("dispatch가 pending 상태에서 재전송되면 다시 dispatch를 시도한다", async () => {
    const chain = createAlertEventsChain({
      insertError: { code: "23505" },
      existingStatus: "pending",
    });
    createServiceClientMock.mockReturnValue({ from: vi.fn(() => chain) });

    const { POST } = await import("./route");
    const res = await POST(buildRequest(VALID_PAYLOAD));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(202);
  });

  it("GitHub dispatch 실패 시 dispatch_status를 갱신하지 않고 500을 반환한다", async () => {
    const chain = createAlertEventsChain({ insertError: null });
    createServiceClientMock.mockReturnValue({ from: vi.fn(() => chain) });
    global.fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 500 })));

    const { POST } = await import("./route");
    const res = await POST(buildRequest(VALID_PAYLOAD));

    expect(chain.update).not.toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(reportServerErrorMock).toHaveBeenCalled();
  });
});
