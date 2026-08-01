import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore, cookiesMock, createServerClientMock } = vi.hoisted(() => {
  const cookieStore = {
    getAll: vi.fn(),
    set: vi.fn(),
  };

  return {
    cookieStore,
    cookiesMock: vi.fn(),
    createServerClientMock: vi.fn(),
  };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { createClient } from "./server";

describe("createClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    cookiesMock.mockResolvedValue(cookieStore);
  });

  it("creates an RLS-aware server client with the public Supabase environment variables", async () => {
    const client = {};
    createServerClientMock.mockReturnValue(client);

    await expect(createClient()).resolves.toBe(client);
    expect(cookiesMock).toHaveBeenCalledOnce();
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
  });
});
