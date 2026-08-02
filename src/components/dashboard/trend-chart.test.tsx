import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/components/dashboard/trend-chart.tsx"),
  "utf8",
);

describe("TrendChart", () => {
  it("차트는 손으로 그리지 않고 Recharts로 만든다 (DESIGN.md)", () => {
    expect(source).toContain('from "recharts"');
    expect(source).not.toContain("<path");
  });

  it("당월 막대만 포인트 컬러로 강조한다", () => {
    expect(source).toContain("var(--color-primary)");
    expect(source).toContain("var(--color-surface-strong)");
  });

  it("토큰을 경유하고 raw hex나 Tailwind 회색 팔레트를 쓰지 않는다", () => {
    const forbiddenColor =
      /(?:#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|zinc|neutral|gray|stone|white|black)(?:-|\b))/;
    expect(source).not.toMatch(forbiddenColor);
  });
});
