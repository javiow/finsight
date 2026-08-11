export function extractCriticalRules(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^-\s*CRITICAL:/.test(line))
    .map((line) => line.replace(/^-\s*/, ""));
}
