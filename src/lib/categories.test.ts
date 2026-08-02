import { describe, expect, it } from "vitest";

import { CATEGORIES } from "./categories";

describe("CATEGORIES", () => {
  it("정확히 12개의 서로 다른 카테고리를 담는다", () => {
    expect(CATEGORIES).toHaveLength(12);
    expect(new Set(CATEGORIES).size).toBe(12);
  });

  it("database.ts의 Category 타입과 동일한 카테고리 집합을 쓴다", () => {
    expect(CATEGORIES).toEqual(
      expect.arrayContaining([
        "식비",
        "생활·마트",
        "쇼핑",
        "주거·관리비",
        "카페·간식",
        "교통",
        "문화·여가",
        "교육",
        "통신",
        "여행·숙박",
        "의료·건강",
        "기타",
      ]),
    );
  });
});
