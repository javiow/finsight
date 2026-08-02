import { describe, expect, it } from "vitest";

import { formatWon } from "./format";

describe("formatWon", () => {
  it("₩ 기호와 천 단위 구분 쉼표를 붙인다", () => {
    expect(formatWon(1234567)).toBe("₩1,234,567");
  });

  it("0원도 올바르게 표기한다", () => {
    expect(formatWon(0)).toBe("₩0");
  });

  it("음수는 부호를 유지한다", () => {
    expect(formatWon(-5000)).toBe("-₩5,000");
  });
});
