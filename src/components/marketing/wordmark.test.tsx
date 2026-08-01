import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/components/marketing/wordmark.tsx"), "utf8");

describe("Wordmark", () => {
  it("로고 파일이 없으므로 finsight 워드마크로 대신한다 (DESIGN.md)", () => {
    expect(source).toMatch(/>\s*finsight\s*</);
  });

  it("Inter 800 weight, letter-spacing -.03em 규칙을 지킨다", () => {
    expect(source).toContain("font-extrabold");
    expect(source).toContain("tracking-[-0.03em]");
  });

  it("토큰을 경유하고 raw hex나 Tailwind 회색 팔레트를 쓰지 않는다", () => {
    const forbiddenColor =
      /(?:#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|zinc|neutral|gray|stone|white|black)(?:-|\b))/;
    expect(source).not.toMatch(forbiddenColor);
  });
});
