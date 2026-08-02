import { redirect } from "next/navigation";

import { EmptyState } from "@/components/dashboard/empty-state";
import { InsightsSection } from "@/components/dashboard/insights-section";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { UploadWidget } from "@/components/dashboard/upload-widget";
import { formatWon } from "@/lib/format";
import { getPlan } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import type { InsightsResponse } from "@/types/api";

function periodBounds(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const start = `${period}-01`;
  const end =
    month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, end };
}

function prevPeriodKey(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const plan = await getPlan(supabase, user.id);

  const { count: statementCount } = await supabase
    .from("statements")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!statementCount) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState />
        <UploadWidget />
      </div>
    );
  }

  const { data: latestRows } = await supabase
    .from("transactions")
    .select("transaction_date")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(1);

  const period = (latestRows?.[0]?.transaction_date as string | undefined)?.slice(0, 7) ?? null;

  let total = 0;
  let prevTotal = 0;
  let count = 0;
  let categories: { name: string; amount: number }[] = [];
  let topCategory: string | null = null;

  if (period) {
    const currentBounds = periodBounds(period);
    const prevBounds = periodBounds(prevPeriodKey(period));

    const { data: rows } = await supabase
      .from("transactions")
      .select("category, amount, transaction_date")
      .eq("user_id", user.id)
      .gte("transaction_date", prevBounds.start)
      .lt("transaction_date", currentBounds.end);

    const transactions = (rows ?? []) as {
      category: string | null;
      amount: number;
      transaction_date: string;
    }[];
    const currentTxns = transactions.filter((t) => t.transaction_date >= currentBounds.start);
    const prevTxns = transactions.filter((t) => t.transaction_date < currentBounds.start);

    const categoryMap = new Map<string, number>();
    for (const t of currentTxns) {
      if (!t.category) continue;
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
    }

    total = currentTxns.reduce((sum, t) => sum + t.amount, 0);
    prevTotal = prevTxns.reduce((sum, t) => sum + t.amount, 0);
    count = currentTxns.length;
    categories = Array.from(categoryMap.entries()).map(([name, amount]) => ({ name, amount }));
    topCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  const { data: cachedInsights } = period
    ? await supabase
        .from("insights")
        .select("category, period, message")
        .eq("user_id", user.id)
        .eq("period", period)
        .order("created_at")
    : { data: [] };

  const delta =
    prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="[font:var(--text-caption)] text-[var(--color-muted)]">{period}</span>
        <h1 className="[font:var(--text-display-lg)] text-[var(--color-ink)]">
          이번 달 지출 정리했어요
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="총 지출"
          value={formatWon(total)}
          delta={delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : undefined}
          tone={delta === null ? "neutral" : delta > 0 ? "danger" : "success"}
        />
        <StatCard label="거래 건수" value={`${count}건`} />
        <StatCard label="가장 큰 카테고리" value={topCategory ?? "-"} />
      </div>

      <section className="rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-[var(--space-xl)] shadow-[var(--shadow-sm)]">
        <h2 className="mb-6 [font:var(--text-display-sm)] text-[var(--color-ink)]">
          카테고리별 지출
        </h2>
        <SpendingChart categories={categories} />
      </section>

      <section className="rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-[var(--space-xl)] shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 [font:var(--text-display-sm)] text-[var(--color-ink)]">
          이번 달 눈에 띄는 변화
        </h2>
        <InsightsSection initialInsights={(cachedInsights ?? []) as InsightsResponse} plan={plan} />
      </section>

      <UploadWidget />
    </div>
  );
}
