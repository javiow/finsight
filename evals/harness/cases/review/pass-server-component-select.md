---
id: review-pass-server-component-select
track: review
expect: pass
rule: 단순 조회는 Server Component에서 @supabase/ssr 서버 클라이언트로 직접 수행한다. 접근 제어는 RLS가 담당한다.
---

다음 Server Component 코드에 CLAUDE.md CRITICAL 규칙 위반이 있는지 검토하고, 있다면 어떤 규칙을 왜 위반했는지 설명하라. 없다면 없다고 명확히 답하라.

```tsx
// app/dashboard/transactions-list.tsx (Server Component, "use client" 없음)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function TransactionsList() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, merchant, amount, category")
    .order("occurred_at", { ascending: false })
    .limit(50);

  return (
    <ul>
      {transactions?.map((t) => (
        <li key={t.id}>
          {t.merchant} — {t.amount}원 ({t.category})
        </li>
      ))}
    </ul>
  );
}
```
