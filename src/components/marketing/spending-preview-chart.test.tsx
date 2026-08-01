import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/components/marketing/spending-preview-chart.tsx"),
  "utf8",
);

describe("SpendingPreviewChart", () => {
  it("차트는 손으로 그리지 않고 Recharts로 만든다 (DESIGN.md)", () => {
    expect(source).toContain('from "recharts"');
    expect(source).not.toContain("<path");
  });

  it("차트 색 램프는 FS_SLICE 산출식을 그대로 따른다", () => {
    expect(source).toContain("color-mix(in oklch, var(--color-primary)");
    expect(source).toContain("color-mix(in oklch, var(--color-muted)");
  });

  it("긴 꼬리 카테고리는 색상 없는 개별 조각으로 남기지 않고 '기타'로 묶는다", () => {
    expect(source).toContain("기타");
  });

  it("금액은 항상 monospace + tabular-nums로 표기한다 (DESIGN.md)", () => {
    expect(source).toContain("var(--text-number");
    expect(source).toContain("tabular-nums");
  });

  it("토큰을 경유하고 raw hex나 Tailwind 회색 팔레트를 쓰지 않는다", () => {
    const forbiddenColor =
      /(?:#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|zinc|neutral|gray|stone|white|black)(?:-|\b))/;
    expect(source).not.toMatch(forbiddenColor);
  });
});
