// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClientMock, getUserMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

import { updateSession } from "./middleware";

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    createServerClientMock.mockReturnValue({
      auth: { getUser: getUserMock },
    });
  });

  it("refreshes the session by calling getUser so Server Component cookie writes aren't required", async () => {
    const request = new NextRequest("http://localhost:3000/dashboard");

    await updateSession(request);

    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
    expect(getUserMock).toHaveBeenCalledOnce();
  });

  it("propagates cookies Supabase refreshes onto the returned response", async () => {
    createServerClientMock.mockImplementation((_url, _key, options) => {
      options.cookies.setAll([
        { name: "sb-access-token", value: "new-token", options: {} },
      ]);
      return { auth: { getUser: getUserMock } };
    });

    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await updateSession(request);

    expect(response.cookies.get("sb-access-token")?.value).toBe("new-token");
  });
});
