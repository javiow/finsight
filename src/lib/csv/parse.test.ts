import { describe, expect, it } from "vitest";

import { CsvParseError, parseCsv } from "./parse";

describe("parseCsv", () => {
  it("헤더와 데이터 행을 분리해서 반환한다", () => {
    const result = parseCsv(
      "날짜,가맹점,금액\n2026-01-01,스타벅스,4500\n2026-01-02,GS25,3200",
    );

    expect(result.headers).toEqual(["날짜", "가맹점", "금액"]);
    expect(result.rows).toEqual([
      ["2026-01-01", "스타벅스", "4500"],
      ["2026-01-02", "GS25", "3200"],
    ]);
  });

  it("헤더만 있고 데이터 행이 없으면 CsvParseError를 던진다", () => {
    expect(() => parseCsv("날짜,가맹점,금액")).toThrow(CsvParseError);
  });

  it("빈 줄은 건너뛴다", () => {
    const result = parseCsv(
      "날짜,가맹점,금액\n2026-01-01,스타벅스,4500\n\n2026-01-02,GS25,3200",
    );

    expect(result.rows).toHaveLength(2);
  });

  it("쉼표를 포함한 따옴표 값을 하나의 필드로 파싱한다", () => {
    const result = parseCsv('날짜,가맹점,금액\n2026-01-01,"이디야, 강남점",4500');

    expect(result.rows[0]).toEqual(["2026-01-01", "이디야, 강남점", "4500"]);
  });
});
