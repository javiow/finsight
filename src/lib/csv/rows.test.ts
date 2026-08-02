import { describe, expect, it } from "vitest";

import { parseTransactionRows, type ColumnMapping } from "./rows";

const mapping: ColumnMapping = {
  dateColumnIndex: 0,
  merchantColumnIndex: 1,
  amountColumnIndex: 2,
};

describe("parseTransactionRows", () => {
  it("정상 행을 파싱한다", () => {
    const result = parseTransactionRows([["2026-01-01", "스타벅스", "4,500"]], mapping);

    expect(result.transactions).toEqual([
      { transaction_date: "2026-01-01", merchant_name: "스타벅스", amount: 4500 },
    ]);
    expect(result.skipped).toBe(0);
  });

  it("YYYYMMDD·YYYY.MM.DD·YYYY/MM/DD 등 여러 날짜 포맷을 인식한다", () => {
    const result = parseTransactionRows(
      [
        ["20260101", "A", "1000"],
        ["2026.01.02", "B", "1000"],
        ["2026/01/03", "C", "1000"],
      ],
      mapping,
    );

    expect(result.transactions.map((t) => t.transaction_date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });

  it("₩ 기호나 쉼표가 섞인 금액을 숫자로 변환한다", () => {
    const result = parseTransactionRows([["2026-01-01", "A", "₩12,000"]], mapping);

    expect(result.transactions[0].amount).toBe(12000);
  });

  it("날짜를 인식할 수 없는 행은 건너뛰고 나머지는 정상 처리한다", () => {
    const result = parseTransactionRows(
      [
        ["깨진날짜", "A", "1000"],
        ["2026-01-01", "B", "2000"],
      ],
      mapping,
    );

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].merchant_name).toBe("B");
    expect(result.skipped).toBe(1);
  });

  it("금액을 숫자로 변환할 수 없는 행은 건너뛴다", () => {
    const result = parseTransactionRows([["2026-01-01", "A", "미상"]], mapping);

    expect(result.transactions).toHaveLength(0);
    expect(result.skipped).toBe(1);
  });

  it("전 행이 스킵되면 빈 배열을 반환한다", () => {
    const result = parseTransactionRows([["x", "A", "y"]], mapping);

    expect(result.transactions).toEqual([]);
    expect(result.skipped).toBe(1);
  });
});
