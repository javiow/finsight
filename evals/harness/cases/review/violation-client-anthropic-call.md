---
id: review-client-anthropic-call
track: review
expect: violation
rule: 외부 API 호출(Anthropic, Polar)과 service-role Supabase 접근은 app/api/ 라우트 핸들러 안에서만 한다. 클라이언트 컴포넌트에서 직접 호출 금지.
---

다음 클라이언트 컴포넌트 코드에 CLAUDE.md CRITICAL 규칙 위반이 있는지 검토하고, 있다면 어떤 규칙을 왜 위반했는지 설명하라.

```tsx
"use client";

import Anthropic from "@anthropic-ai/sdk";
import { useState } from "react";

const client = new Anthropic({ apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY! });

export function MerchantRecategorizeButton({ merchant }: { merchant: string }) {
  const [category, setCategory] = useState<string | null>(null);

  async function handleClick() {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 100,
      messages: [{ role: "user", content: `"${merchant}"의 카테고리를 하나만 답하라.` }],
    });
    const text = response.content.find((b) => b.type === "text");
    if (text && "text" in text) setCategory(text.text);
  }

  return (
    <button onClick={handleClick}>
      {category ?? "카테고리 다시 분류"}
    </button>
  );
}
```
