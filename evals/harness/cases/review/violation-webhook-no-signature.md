---
id: review-webhook-no-signature
track: review
expect: violation
rule: 사용자 요청 API는 middleware와 별개로 자체 세션 검증을 수행한다. Polar webhook은 raw body 서명 검증, Vercel cron은 CRON_SECRET 검증으로 인증한다.
---

다음 API 라우트 코드에 CLAUDE.md CRITICAL 규칙 위반이 있는지 검토하고, 있다면 어떤 규칙을 왜 위반했는지 설명하라.

```ts
// app/api/webhooks/polar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const event = await req.json();

  if (event.type === "subscription.updated") {
    const service = createServiceClient();
    await service
      .from("subscriptions")
      .update({ status: event.data.status })
      .eq("polar_customer_id", event.data.customer_id);
  }

  return NextResponse.json({ received: true });
}
```
