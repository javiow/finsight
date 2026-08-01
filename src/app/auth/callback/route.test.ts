// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { exchangeCodeForSessionMock, createClientMock } = vi.hoisted(() => ({
  exchangeCodeForSessionMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession: exchangeCodeForSessionMock },
    });
  });

  it("code를 세션으로 교환하고 성공하면 대시보드로 리다이렉트한다", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    const request = new NextRequest("http://localhost:3000/auth/callback?code=abc123");

    const response = await GET(request);

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("abc123");
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("교환에 실패하면 에러 표시와 함께 로그인 페이지로 되돌아간다", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: { message: "invalid grant" },
    });
    const request = new NextRequest("http://localhost:3000/auth/callback?code=bad");

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth",
    );
  });

  it("code 파라미터가 없으면 세션 교환을 시도하지 않고 로그인 페이지로 되돌아간다", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");

    const response = await GET(request);

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth",
    );
  });
});
