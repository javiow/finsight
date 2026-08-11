import { extractText, type ChatClient } from "../lib/anthropicClient.ts";
import { SUBJECT_MODEL } from "../lib/models.ts";
import type { QaCase } from "../lib/types.ts";

export function buildQaSystemPrompt(claudeMdContent: string): string {
  return [
    "다음은 FinSight 프로젝트의 CLAUDE.md 규약 전문이다. 이 문서만을 근거로 아래 질문에 답하라.",
    "질문의 전제가 문서 내용과 다르면 그대로 받아들이지 말고 정정하라.",
    "",
    claudeMdContent,
  ].join("\n");
}

export async function runQaSubject(
  client: ChatClient,
  claudeMdContent: string,
  qaCase: QaCase,
): Promise<string> {
  const response = await client.messages.create({
    model: SUBJECT_MODEL,
    max_tokens: 1024,
    temperature: 0,
    system: buildQaSystemPrompt(claudeMdContent),
    messages: [{ role: "user", content: qaCase.prompt }],
  });
  return extractText(response);
}
