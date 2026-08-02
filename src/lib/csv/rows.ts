export interface ColumnMapping {
  dateColumnIndex: number;
  merchantColumnIndex: number;
  amountColumnIndex: number;
}

export interface ParsedTransactionRow {
  transaction_date: string;
  merchant_name: string;
  amount: number;
}

export interface ParseRowsResult {
  transactions: ParsedTransactionRow[];
  skipped: number;
}

function normalizeDate(raw: string): string {
  const trimmed = raw.trim();

  const compact = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;

  const delimited = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (delimited) {
    return `${delimited[1]}-${delimited[2].padStart(2, "0")}-${delimited[3].padStart(2, "0")}`;
  }

  throw new Error(`인식할 수 없는 날짜 형식: ${raw}`);
}

function normalizeAmount(raw: string): number {
  const cleaned = raw.replace(/[₩,\s]/g, "");
  const amount = Number(cleaned);
  if (cleaned === "" || !Number.isFinite(amount)) {
    throw new Error(`인식할 수 없는 금액: ${raw}`);
  }
  return amount;
}

export function parseTransactionRows(
  rows: string[][],
  mapping: ColumnMapping,
): ParseRowsResult {
  const transactions: ParsedTransactionRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    try {
      const transaction_date = normalizeDate(row[mapping.dateColumnIndex] ?? "");
      const merchant_name = (row[mapping.merchantColumnIndex] ?? "").trim();
      const amount = normalizeAmount(row[mapping.amountColumnIndex] ?? "");

      if (!merchant_name) {
        throw new Error("가맹점명이 비어 있습니다.");
      }

      transactions.push({ transaction_date, merchant_name, amount });
    } catch {
      skipped++;
    }
  }

  return { transactions, skipped };
}
