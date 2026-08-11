export interface ChatClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      temperature?: number;
      system?: string;
      messages: { role: "user"; content: string }[];
    }): Promise<{ content: { type: string; text?: string }[] }>;
  };
}

export function extractText(response: { content: { type: string; text?: string }[] }): string {
  return response.content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n")
    .trim();
}
