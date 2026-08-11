---
id: review-raw-csv-to-llm
track: review
expect: violation
rule: 원본 CSV와 식별정보를 외부 모델에 보내지 않는다. LLM에는 비식별화된 미리보기·가맹점명·집계 숫자만 목적별로 보낸다.
---

다음 API 라우트 코드에 CLAUDE.md CRITICAL 규칙 위반이 있는지 검토하고, 있다면 어떤 규칙을 왜 위반했는지 설명하라.

```ts
// app/api/statements/[id]/classify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClaudeClient, CLAUDE_MODEL } from "@/services/claude";

export async function POST(req: NextRequest) {
  const { csvText } = await req.json();

  const client = createClaudeClient();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `다음 카드 명세서 원본 CSV를 보고 각 행을 카테고리로 분류하라:\n\n${csvText}`,
      },
    ],
  });

  return NextResponse.json({ result: response.content });
}
```
