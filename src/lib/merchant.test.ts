import { describe, expect, it } from "vitest";

import { normalizeMerchantName } from "./merchant";

describe("normalizeMerchantName", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(normalizeMerchantName("  스타벅스  ")).toBe("스타벅스");
  });

  it("내부의 연속된 공백을 하나로 줄인다", () => {
    expect(normalizeMerchantName("이디야   강남점")).toBe("이디야 강남점");
  });

  it("영문은 대문자로 통일한다", () => {
    expect(normalizeMerchantName("cu 편의점")).toBe("CU 편의점");
  });

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(normalizeMerchantName("   ")).toBe("");
  });
});
