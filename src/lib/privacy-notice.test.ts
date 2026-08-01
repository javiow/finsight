import { describe, expect, it } from "vitest";

import { PRIVACY_NOTICE } from "./privacy-notice";

describe("PRIVACY_NOTICE", () => {
  it("랜딩과 업로드 화면이 재사용할 3개 항목을 담는다", () => {
    expect(PRIVACY_NOTICE).toHaveLength(3);
    for (const item of PRIVACY_NOTICE) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it("PRD의 프라이버시 약속(비식별화·마스킹·30일 삭제)을 그대로 담는다", () => {
    const joined = PRIVACY_NOTICE.map((item) => `${item.title} ${item.description}`).join(" ");
    expect(joined).toContain("비식별화");
    expect(joined).toContain("마스킹");
    expect(joined).toContain("30일");
  });
});
