import { redirect } from "next/navigation";

import { CategorySelect } from "@/components/dashboard/category-select";
import { formatWon } from "@/lib/format";
import { getPlan } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const plan = await getPlan(supabase, user.id);

  const { count: totalCount } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  let query = supabase
    .from("transactions")
    .select("id, transaction_date, merchant_name, category, amount")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false });

  if (plan === "free") {
    const { data: latestRows } = await supabase
      .from("transactions")
      .select("transaction_date")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(1);
    const latestPeriod = (latestRows?.[0]?.transaction_date as string | undefined)?.slice(0, 7);
    if (latestPeriod) {
      query = query.gte("transaction_date", `${latestPeriod}-01`);
    }
  }

  const { data: transactions } = await query;
  const rows = (transactions ?? []) as {
    id: string;
    transaction_date: string;
    merchant_name: string;
    category: Category | null;
    amount: number;
  }[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="[font:var(--text-display-lg)] text-[var(--color-ink)]">거래 내역</h1>
        <span className="[font:var(--text-caption)] text-[var(--color-muted)]">
          {rows.length}/{totalCount ?? 0}건 표시
        </span>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-canvas)] shadow-[var(--shadow-sm)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] [font:var(--text-caption)] text-[var(--color-muted)]">
              <th className="px-4 py-3 font-normal">날짜</th>
              <th className="px-4 py-3 font-normal">가맹점</th>
              <th className="px-4 py-3 font-normal">카테고리</th>
              <th className="px-4 py-3 text-right font-normal">금액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--color-hairline)] last:border-0"
              >
                <td className="px-4 py-3 [font:var(--text-body-sm)] text-[var(--color-body)]">
                  {row.transaction_date}
                </td>
                <td className="px-4 py-3 [font:var(--text-body-sm)] text-[var(--color-ink)]">
                  {row.merchant_name}
                </td>
                <td className="px-4 py-3">
                  <CategorySelect transactionId={row.id} category={row.category ?? "기타"} />
                </td>
                <td className="px-4 py-3 text-right [font:var(--text-number-sm)] tabular-nums text-[var(--color-ink)]">
                  {formatWon(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plan === "free" && (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] p-[var(--space-xl)] text-center shadow-[var(--shadow-sm)]">
          <p className="[font:var(--text-body-md)] text-[var(--color-muted)]">
            이전 달 내역은 잠겨 있어요
          </p>
          <a
            href="/pricing"
            className="[font:var(--text-body-sm)] text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            전체 히스토리 열기 →
          </a>
        </div>
      )}
    </div>
  );
}
