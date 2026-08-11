import { NextResponse } from "next/server";

import { ApiError, errorResponse } from "@/lib/api-error";
import { getPlan } from "@/lib/plan";
import { reportServerError } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClaudeClient, generateInsights, type CategoryAggregate } from "@/services/claude";
import { ApiErrorCode, type InsightItem, type InsightsResponse } from "@/types/api";
import type { Category } from "@/types/database";

const TOP_MERCHANT_LIMIT = 5;

function periodKey(dateString: string): string {
  return dateString.slice(0, 7);
}

function periodBounds(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const start = `${period}-01`;
  const end = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, end };
}

function prevPeriodKey(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

export async function POST(): Promise<NextResponse> {
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new ApiError(ApiErrorCode.UNAUTHORIZED, 401);
    }
    userId = user.id;

    const service = createServiceClient();

    const plan = await getPlan(supabase, user.id);
    const targetCount = plan === "pro" ? 3 : 1;

    const { data: latestRows } = await service
      .from("transactions")
      .select("transaction_date")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(1);

    const latest = (latestRows ?? [])[0] as { transaction_date: string } | undefined;
    if (!latest) {
      const empty: InsightsResponse = [];
      return NextResponse.json(empty, { status: 200 });
    }

    const period = periodKey(latest.transaction_date);

    const { data: cachedRows } = await service
      .from("insights")
      .select("category, period, message")
      .eq("user_id", user.id)
      .eq("period", period)
      .order("created_at")
      .limit(targetCount);

    const cached = (cachedRows ?? []) as InsightItem[];
    if (cached.length >= targetCount) {
      return NextResponse.json(cached, { status: 200 });
    }

    const currentBounds = periodBounds(period);
    const prevBounds = periodBounds(prevPeriodKey(period));

    const { data: rangeRows } = await service
      .from("transactions")
      .select("category, amount, merchant_name, transaction_date")
      .eq("user_id", user.id)
      .gte("transaction_date", prevBounds.start)
      .lt("transaction_date", currentBounds.end);

    const transactions = (rangeRows ?? []) as {
      category: Category | null;
      amount: number;
      merchant_name: string;
      transaction_date: string;
    }[];

    const currentTxns = transactions.filter((t) => t.transaction_date >= currentBounds.start);
    const prevTxns = transactions.filter((t) => t.transaction_date < currentBounds.start);

    const categoryMap = new Map<Category, CategoryAggregate>();
    for (const t of currentTxns) {
      if (!t.category) continue;
      const entry = categoryMap.get(t.category) ?? {
        category: t.category,
        amount: 0,
        prevAmount: 0,
        count: 0,
      };
      entry.amount += t.amount;
      entry.count += 1;
      categoryMap.set(t.category, entry);
    }
    for (const t of prevTxns) {
      if (!t.category) continue;
      const entry = categoryMap.get(t.category);
      if (entry) entry.prevAmount += t.amount;
    }

    const merchantMap = new Map<string, number>();
    for (const t of currentTxns) {
      merchantMap.set(t.merchant_name, (merchantMap.get(t.merchant_name) ?? 0) + t.amount);
    }
    const topMerchants = Array.from(merchantMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_MERCHANT_LIMIT)
      .map(([merchant, amount]) => ({ merchant, amount }));

    const generated = await generateInsights(createClaudeClient(), {
      period,
      categories: Array.from(categoryMap.values()),
      topMerchants,
      count: targetCount as 1 | 3,
    });

    const now = new Date().toISOString();
    const rows = generated.map((insight) => ({
      user_id: user.id,
      period,
      category: insight.category,
      message: insight.message,
      created_at: now,
    }));
    await service
      .from("insights")
      .upsert(rows, { onConflict: "user_id,period,category" });

    const body: InsightsResponse = generated.map((insight) => ({
      category: insight.category,
      period,
      message: insight.message,
    }));
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error);
    await reportServerError(error, { route: "POST /api/insights", distinctId: userId });
    return errorResponse(new ApiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 500));
  }
}
