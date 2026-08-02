import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

export class CsvParseError extends Error {}

export function parseCsv(text: string): ParsedCsv {
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });

  if (result.data.length < 2) {
    throw new CsvParseError("CSV에 헤더 외 데이터 행이 없습니다.");
  }

  const [headers, ...rows] = result.data;
  return { headers, rows };
}
