import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/components/marketing/site-header.tsx"), "utf8");

describe("SiteHeader", () => {
  it("요금제는 프로토타입과 달리 실제 링크다 (프로토타입은 클릭 불가능한 span이었다)", () => {
    expect(source).toContain('from "next/link"');
    expect(source).toContain('href="/pricing"');
  });

  it("워드마크를 재사용해 홈으로 이동하는 링크를 감싼다", () => {
    expect(source).toContain("Wordmark");
    expect(source).toContain('href="/"');
  });

  it("이동 CTA는 Link에 buttonVariants를 입혀 만들고, Button(render prop)으로 감싸지 않는다 — Base UI가 Link를 role=\"button\"으로 바꿔 링크 시맨틱을 깨는 걸 방지한다", () => {
    expect(source).toContain("buttonVariants");
    expect(source).not.toContain("render={<Link");
  });

  it("토큰을 경유하고 raw hex나 Tailwind 회색 팔레트를 쓰지 않는다", () => {
    const forbiddenColor =
      /(?:#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|zinc|neutral|gray|stone|white|black)(?:-|\b))/;
    expect(source).not.toMatch(forbiddenColor);
  });
});
