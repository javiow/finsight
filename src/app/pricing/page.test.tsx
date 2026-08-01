import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/app/pricing/page.tsx"), "utf8");

describe("가격 페이지", () => {
  it("Free(₩0)·Pro(₩4,900) 요금을 PRD 그대로 보여준다", () => {
    expect(source).toContain("₩0");
    expect(source).toContain("₩4,900");
  });

  it("Pro 카드에 추천 배지를 단다", () => {
    expect(source).toContain("추천");
  });

  it("결제 없이 Pro를 체험하도록 샌드박스 테스트 카드 번호를 안내한다 (PRD)", () => {
    expect(source).toContain("4242 4242 4242 4242");
  });

  it("결제는 로그인 이후에 시작되므로 CTA는 /login으로 보낸다 (ARCHITECTURE: 세션에서 user id 주입)", () => {
    expect(source).toContain('href="/login"');
  });

  it("공유 헤더를 재사용해 랜딩과 동일한 내비게이션을 유지한다", () => {
    expect(source).toContain("SiteHeader");
  });

  it("Free로 떨어져도 데이터는 지우지 않는다는 사실을 왜곡하지 않는다 (다크패턴 금지)", () => {
    expect(source).not.toContain("삭제됩니다");
  });

  it("이동 CTA는 Link에 buttonVariants를 입혀 만들고, Button(render prop)으로 감싸지 않는다 — Base UI가 Link를 role=\"button\"으로 바꿔 링크 시맨틱을 깨는 걸 방지한다", () => {
    expect(source).toContain("buttonVariants");
    expect(source).not.toContain("render={<Link");
  });
});
