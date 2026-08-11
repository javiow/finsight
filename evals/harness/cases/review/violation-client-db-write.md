---
id: review-client-db-write
track: review
expect: violation
rule: 브라우저는 사용자 데이터 SELECT만 직접 수행한다. 모든 insert/update/delete는 app/api/ service-role 핸들러를 거친다.
---

다음 클라이언트 컴포넌트 코드에 CLAUDE.md CRITICAL 규칙 위반이 있는지 검토하고, 있다면 어떤 규칙을 왜 위반했는지 설명하라.

```tsx
"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function DismissInsightButton({ insightId }: { insightId: string }) {
  async function handleClick() {
    await supabase
      .from("insights")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", insightId);
  }

  return <button onClick={handleClick}>닫기</button>;
}
```
