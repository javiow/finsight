import { NextResponse, type NextRequest } from "next/server";

import { ApiError, errorResponse } from "@/lib/api-error";
import { normalizeMerchantName } from "@/lib/merchant";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { classifyMerchants, createClaudeClient } from "@/services/claude";
import { ApiErrorCode, type ClassifyStatementResponse } from "@/types/api";
import type { Category } from "@/types/database";

const MERCHANT_BATCH_LIMIT = 100;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: statementId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new ApiError(ApiErrorCode.UNAUTHORIZED, 401);
    }

    const service = createServiceClient();

    const { data: statement } = await service
      .from("statements")
      .select("id")
      .eq("id", statementId)
      .eq("user_id", user.id)
      .single();
    if (!statement) {
      throw new ApiError(ApiErrorCode.FORBIDDEN, 403);
    }

    const { data: pendingRows } = await service
      .from("transactions")
      .select("merchant_name")
      .eq("statement_id", statementId)
      .is("category", null);

    const rawNames = Array.from(
      new Set(((pendingRows ?? []) as { merchant_name: string }[]).map((row) => row.merchant_name)),
    ).slice(0, MERCHANT_BATCH_LIMIT);

    if (rawNames.length > 0) {
      const normalizedByRaw = new Map(rawNames.map((raw) => [raw, normalizeMerchantName(raw)]));
      const normalizedKeys = Array.from(new Set(normalizedByRaw.values()));

      const { data: cachedRows } = await service
        .from("user_merchant_categories")
        .select("merchant_name, category")
        .eq("user_id", user.id)
        .in("merchant_name", normalizedKeys);

      const cacheMap = new Map(
        ((cachedRows ?? []) as { merchant_name: string; category: Category }[]).map((row) => [
          row.merchant_name,
          row.category,
        ]),
      );
      const misses = normalizedKeys.filter((key) => !cacheMap.has(key));

      if (misses.length > 0) {
        const classified = await classifyMerchants(createClaudeClient(), misses);

        if (classified.size > 0) {
          const now = new Date().toISOString();
          const upsertRows = Array.from(classified.entries()).map(([merchant_name, category]) => ({
            user_id: user.id,
            merchant_name,
            category,
            source: "ai" as const,
            updated_at: now,
          }));
          await service
            .from("user_merchant_categories")
            .upsert(upsertRows, { onConflict: "user_id,merchant_name", ignoreDuplicates: true });
          for (const [key, category] of classified) {
            cacheMap.set(key, category);
          }
        }
      }

      const rawNamesByCategory = new Map<Category, string[]>();
      for (const raw of rawNames) {
        const normalized = normalizedByRaw.get(raw)!;
        const category = cacheMap.get(normalized);
        if (!category) continue;
        const list = rawNamesByCategory.get(category) ?? [];
        list.push(raw);
        rawNamesByCategory.set(category, list);
      }

      for (const [category, rawList] of rawNamesByCategory) {
        await service
          .from("transactions")
          .update({ category })
          .eq("statement_id", statementId)
          .in("merchant_name", rawList)
          .is("category", null);
      }
    }

    const { count: pending } = await service
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("statement_id", statementId)
      .is("category", null);

    const { count: total } = await service
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("statement_id", statementId);

    if ((pending ?? 0) === 0) {
      await service.from("statements").update({ status: "ready" }).eq("id", statementId);
    }

    const body: ClassifyStatementResponse = { pending: pending ?? 0, total: total ?? 0 };
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    return errorResponse(new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 500));
  }
}
