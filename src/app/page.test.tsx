import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");

describe("랜딩 페이지", () => {
  it("헤더·프라이버시·차트 프리뷰 컴포넌트를 재사용한다", () => {
    expect(source).toContain("SiteHeader");
    expect(source).toContain("PrivacyList");
    expect(source).toContain("SpendingPreviewChart");
  });

  it("주 CTA는 로그인, 보조 CTA는 요금제로 보낸다 (실제로 만들어지지 않은 화면으로 보내지 않는다)", () => {
    expect(source).toContain('href="/login"');
    expect(source).toContain('href="/pricing"');
  });

  it("지출 미리보기는 예시 데이터임을 밝힌다 (첫 방문자가 실제 데이터로 오해하지 않도록)", () => {
    expect(source).toContain("예시");
  });

  it("프라이버시 약속을 랜딩에서도 고지한다 (PRD: 1차 전환 장벽)", () => {
    expect(source).toContain("프라이버시");
  });

  it("30일 자동 삭제 문구를 푸터에 남긴다", () => {
    expect(source).toContain("30일");
  });

  it("조작된 사회적 증거(가짜 후기·가입자 수)를 넣지 않는다 (docs/UX.md)", () => {
    expect(source).not.toContain("가입자");
    expect(source).not.toContain("후기");
    expect(source).not.toContain("평점");
  });

  it("이동 CTA는 Link에 buttonVariants를 입혀 만들고, Button(render prop)으로 감싸지 않는다 — Base UI가 Link를 role=\"button\"으로 바꿔 링크 시맨틱을 깨는 걸 방지한다", () => {
    expect(source).toContain("buttonVariants");
    expect(source).not.toContain("render={<Link");
  });
});
