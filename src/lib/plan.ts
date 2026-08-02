import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiErrorCode } from "@/types/api";
import type { Plan } from "@/types/database";

import { ApiError } from "./api-error";

export async function getPlan(supabase: SupabaseClient, userId: string): Promise<Plan> {
  const { data } = await supabase.from("profiles").select("plan").eq("id", userId).single();

  return (data?.plan as Plan | undefined) ?? "free";
}

export async function requirePro(supabase: SupabaseClient, userId: string): Promise<void> {
  const plan = await getPlan(supabase, userId);
  if (plan !== "pro") {
    throw new ApiError(ApiErrorCode.FORBIDDEN, 403);
  }
}
