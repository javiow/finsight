import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "./api-error";
import { getPlan, requirePro } from "./plan";

function createSupabaseMock(profile: { plan: string } | null): SupabaseClient {
  const single = vi.fn().mockResolvedValue({ data: profile });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

describe("getPlan", () => {
  it("profile이 있으면 해당 plan을 반환한다", async () => {
    const supabase = createSupabaseMock({ plan: "pro" });

    await expect(getPlan(supabase, "user-1")).resolves.toBe("pro");
  });

  it("profile이 없으면 free를 기본값으로 반환한다", async () => {
    const supabase = createSupabaseMock(null);

    await expect(getPlan(supabase, "user-1")).resolves.toBe("free");
  });
});

describe("requirePro", () => {
  it("plan이 pro면 정상적으로 반환한다(reject 없음)", async () => {
    const supabase = createSupabaseMock({ plan: "pro" });

    await expect(requirePro(supabase, "user-1")).resolves.toBeUndefined();
  });

  it("plan이 free면 403 FORBIDDEN ApiError를 던진다", async () => {
    const supabase = createSupabaseMock({ plan: "free" });

    const promise = requirePro(supabase, "user-1");

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(requirePro(supabase, "user-1")).rejects.toMatchObject({ status: 403 });
  });
});
