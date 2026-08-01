// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: updateSessionMock,
}));

import { middleware } from "./middleware";

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates every request to updateSession to keep the Supabase session fresh", async () => {
    const response = { ok: true };
    updateSessionMock.mockResolvedValue(response);
    const request = new NextRequest("http://localhost:3000/dashboard");

    await expect(middleware(request)).resolves.toBe(response);
    expect(updateSessionMock).toHaveBeenCalledWith(request);
  });
});
