import { extractText, type ChatClient } from "../lib/anthropicClient.ts";
import { SUBJECT_MODEL } from "../lib/models.ts";
import type { ReviewCase } from "../lib/types.ts";

export async function runReviewSubject(
  client: ChatClient,
  systemPrompt: string,
  reviewCase: ReviewCase,
): Promise<string> {
  const response = await client.messages.create({
    model: SUBJECT_MODEL,
    max_tokens: 1024,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: "user", content: reviewCase.prompt }],
  });
  return extractText(response);
}
