import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/components/marketing/section-head.tsx"), "utf8");

describe("SectionHead", () => {
  it("제목은 페이지의 유일한 h1과 구분되도록 h2로 렌더한다", () => {
    expect(source).toContain("<h2");
  });

  it("eyebrow는 대문자·자간 확장 캡션 스타일을 쓴다", () => {
    expect(source).toContain("uppercase");
    expect(source).toContain("tracking-[0.08em]");
  });

  it("토큰을 경유하고 raw hex나 Tailwind 회색 팔레트를 쓰지 않는다", () => {
    const forbiddenColor =
      /(?:#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|zinc|neutral|gray|stone|white|black)(?:-|\b))/;
    expect(source).not.toMatch(forbiddenColor);
  });
});
