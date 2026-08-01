import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
}));

import { createClient } from "./browser";

describe("createClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("creates a browser client with the public Supabase environment variables", () => {
    const client = {};
    createBrowserClientMock.mockReturnValue(client);

    expect(createClient()).toBe(client);
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "anon-key",
    );
  });
});
