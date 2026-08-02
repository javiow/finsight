import { redirect } from "next/navigation";

import { LockVeil } from "@/components/dashboard/lock-veil";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ApiError } from "@/lib/api-error";
import { requirePro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";

const MONTHS_TO_SHOW = 5;

export default async function TrendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  let isPro = true;
  try {
    await requirePro(supabase, user.id);
  } catch (error) {
    if (error instanceof ApiError) {
      isPro = false;
    } else {
      throw error;
    }
  }

  if (!isPro) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="[font:var(--text-display-lg)] text-[var(--color-ink)]">월별 추이</h1>
        <div className="fs-lock relative min-h-[280px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-canvas)] shadow-[var(--shadow-sm)]">
          <LockVeil
            title="월별 추이는 Pro 기능이에요"
            note="Pro로 업그레이드하면 최근 5개월 추이를 볼 수 있어요"
          />
        </div>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("transactions")
    .select("transaction_date, amount")
    .eq("user_id", user.id);

  const monthly = new Map<string, number>();
  for (const row of (rows ?? []) as { transaction_date: string; amount: number }[]) {
    const month = row.transaction_date.slice(0, 7);
    monthly.set(month, (monthly.get(month) ?? 0) + row.amount);
  }

  const months = Array.from(monthly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-MONTHS_TO_SHOW)
    .map(([month, amount]) => ({ month, amount }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="[font:var(--text-display-lg)] text-[var(--color-ink)]">월별 추이</h1>
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-[var(--space-xl)] shadow-[var(--shadow-sm)]">
        {months.length > 0 ? (
          <TrendChart months={months} />
        ) : (
          <p className="[font:var(--text-body-md)] text-[var(--color-muted)]">
            아직 데이터가 없어요.
          </p>
        )}
      </div>
    </div>
  );
}
