import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/components/marketing/privacy-list.tsx"), "utf8");

describe("PrivacyList", () => {
  it("문구를 직접 하드코딩하지 않고 공유 상수(PRIVACY_NOTICE)를 재사용한다", () => {
    expect(source).toContain("privacy-notice");
    expect(source).not.toContain("원본 CSV");
  });

  it("아이콘은 손으로 그리지 않고 lucide-react를 쓴다", () => {
    expect(source).toContain('from "lucide-react"');
    expect(source).not.toContain("<svg");
  });

  it("토큰을 경유하고 raw hex나 Tailwind 회색 팔레트를 쓰지 않는다", () => {
    const forbiddenColor =
      /(?:#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|zinc|neutral|gray|stone|white|black)(?:-|\b))/;
    expect(source).not.toMatch(forbiddenColor);
  });
});
