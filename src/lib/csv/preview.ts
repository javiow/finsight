import type { ParsedCsv } from "./parse";

export type ColumnShape = "숫자" | "날짜형" | "문자열" | "빈값";

export interface PreviewColumn {
  index: number;
  header: string;
  candidateSamples?: string[];
  shape?: ColumnShape;
}

export interface MaskedPreview {
  headers: string[];
  columns: PreviewColumn[];
}

const DENYLIST_HEADER_KEYWORDS = [
  "카드번호",
  "계좌",
  "계좌번호",
  "전화",
  "연락처",
  "휴대폰",
  "주민등록",
  "주민번호",
  "이메일",
  "card",
  "account",
  "phone",
  "ssn",
  "email",
];

const CARD_NUMBER_PATTERN = /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/;
const PHONE_PATTERN = /01[0-9][-\s]?\d{3,4}[-\s]?\d{4}/;
const RRN_PATTERN = /\d{6}[-\s]?\d{7}/;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;

const DATE_HEADER_KEYWORDS = ["날짜", "거래일", "승인일", "이용일"];
const MERCHANT_HEADER_KEYWORDS = ["가맹점", "상호", "사용처"];
const AMOUNT_HEADER_KEYWORDS = ["금액", "승인금액", "이용금액"];

export function isDenylistedHeader(header: string): boolean {
  const normalized = header.toLowerCase();
  return DENYLIST_HEADER_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function matchesDenylistValuePattern(value: string): boolean {
  return (
    CARD_NUMBER_PATTERN.test(value) ||
    PHONE_PATTERN.test(value) ||
    RRN_PATTERN.test(value) ||
    EMAIL_PATTERN.test(value)
  );
}

export function classifyCandidateColumn(header: string): "date" | "merchant" | "amount" | null {
  if (DATE_HEADER_KEYWORDS.some((keyword) => header.includes(keyword))) return "date";
  if (MERCHANT_HEADER_KEYWORDS.some((keyword) => header.includes(keyword))) return "merchant";
  if (AMOUNT_HEADER_KEYWORDS.some((keyword) => header.includes(keyword))) return "amount";
  return null;
}

export function summarizeShape(values: string[]): ColumnShape {
  const nonEmpty = values.filter((value) => value.trim().length > 0);
  if (nonEmpty.length === 0) return "빈값";

  if (nonEmpty.every((value) => /^-?[\d,.\s₩]+$/.test(value))) return "숫자";
  if (nonEmpty.every((value) => /^\d{4}[-./]\d{1,2}[-./]\d{1,2}$|^\d{8}$/.test(value))) {
    return "날짜형";
  }
  return "문자열";
}

export function buildMaskedPreview(csv: ParsedCsv, maxRows = 20): MaskedPreview {
  const sampleRows = csv.rows.slice(0, maxRows);

  const columns: PreviewColumn[] = csv.headers.map((header, index) => {
    const values = sampleRows.map((row) => row[index] ?? "");

    if (isDenylistedHeader(header)) {
      return { index, header, shape: summarizeShape(values) };
    }

    const candidate = classifyCandidateColumn(header);
    if (candidate && !values.some(matchesDenylistValuePattern)) {
      return { index, header, candidateSamples: values };
    }

    return { index, header, shape: summarizeShape(values) };
  });

  return { headers: csv.headers, columns };
}
