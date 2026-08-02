import { describe, expect, it } from "vitest";

import type { ParsedCsv } from "./parse";
import { buildMaskedPreview } from "./preview";

function csv(headers: string[], rows: string[][]): ParsedCsv {
  return { headers, rows };
}

describe("buildMaskedPreview", () => {
  it("카드번호 헤더 컬럼은 원값 없이 형태 요약만 노출한다", () => {
    const preview = buildMaskedPreview(
      csv(["카드번호", "가맹점"], [["1234-5678-9012-3456", "스타벅스"]]),
    );

    const cardColumn = preview.columns[0];
    expect(cardColumn.candidateSamples).toBeUndefined();
    expect(["숫자", "날짜형", "문자열", "빈값"]).toContain(cardColumn.shape);
  });

  it("헤더가 무해해도 값이 카드번호 패턴이면 형태 요약만 노출한다", () => {
    const preview = buildMaskedPreview(csv(["컬럼A"], [["1234-5678-9012-3456"]]));

    expect(preview.columns[0].candidateSamples).toBeUndefined();
  });

  it("거래일자 후보 헤더는 원값(candidateSamples)을 노출한다", () => {
    const preview = buildMaskedPreview(
      csv(["거래일자", "가맹점"], [["2026-01-01", "스타벅스"]]),
    );

    expect(preview.columns[0].candidateSamples).toEqual(["2026-01-01"]);
    expect(preview.columns[0].shape).toBeUndefined();
  });

  it("판별되지 않는 헤더의 숫자 값은 shape:'숫자'로 요약한다", () => {
    const preview = buildMaskedPreview(csv(["컬럼A"], [["4500"], ["3200"]]));

    expect(preview.columns[0].shape).toBe("숫자");
  });

  it("20행을 초과하는 candidateSamples는 20개로 절단한다", () => {
    const rows = Array.from({ length: 25 }, (_, i) => [`가맹점${i}`]);
    const preview = buildMaskedPreview(csv(["가맹점"], rows));

    expect(preview.columns[0].candidateSamples).toHaveLength(20);
  });

  it("대부분 빈 값인 컬럼은 shape:'빈값'으로 요약한다", () => {
    const preview = buildMaskedPreview(csv(["컬럼A"], [[""], [""], [""]]));

    expect(preview.columns[0].shape).toBe("빈값");
  });
});
