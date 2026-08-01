import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { createServiceClient } from "./service";

describe("createServiceClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  });

  it("creates a service client with the service-role key instead of the anon key", () => {
    const client = {};
    createClientMock.mockReturnValue(client);

    expect(createServiceClient()).toBe(client);
    expect(createClientMock).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "service-role-key",
    );
    expect(createClientMock).not.toHaveBeenCalledWith(
      "https://project.supabase.co",
      "anon-key",
    );
  });
});
