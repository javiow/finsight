import type { Case } from "./types.ts";

type FrontmatterValue = string | string[] | boolean;
type FrontmatterData = Record<string, FrontmatterValue>;

function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("케이스 파일은 '---'로 시작하는 frontmatter로 시작해야 합니다.");
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("frontmatter를 닫는 '---'를 찾을 수 없습니다.");
  }
  const frontmatter = normalized.slice(4, end);
  const body = normalized.slice(end + 4).replace(/^\n/, "").trim();
  return { frontmatter, body };
}

function parseFrontmatter(text: string): FrontmatterData {
  const data: FrontmatterData = {};
  let currentKey: string | null = null;
  let currentList: string[] | null = null;

  const flushList = () => {
    if (currentKey !== null && currentList !== null) {
      data[currentKey] = currentList;
    }
    currentKey = null;
    currentList = null;
  };

  for (const rawLine of text.split("\n")) {
    if (!rawLine.trim()) continue;

    const listItemMatch = rawLine.match(/^\s+-\s+(.*)$/);
    if (listItemMatch && currentList !== null) {
      currentList.push(listItemMatch[1].trim());
      continue;
    }

    flushList();

    const kvMatch = rawLine.match(/^([A-Za-z_]+):\s?(.*)$/);
    if (!kvMatch) {
      throw new Error(`frontmatter 라인을 해석할 수 없습니다: "${rawLine}"`);
    }
    const [, key, rest] = kvMatch;
    const value = rest.trim();

    if (value === "") {
      currentKey = key;
      currentList = [];
    } else if (value === "true" || value === "false") {
      data[key] = value === "true";
    } else {
      data[key] = value;
    }
  }
  flushList();

  return data;
}

function requireString(data: FrontmatterData, key: string, sourcePath: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${sourcePath}: frontmatter에 "${key}" 필드가 필요합니다.`);
  }
  return value;
}

function optionalStringArray(data: FrontmatterData, key: string): string[] {
  const value = data[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`"${key}" 필드는 리스트여야 합니다.`);
  }
  return value;
}

export function parseCase(raw: string, sourcePath: string): Case {
  const { frontmatter, body } = splitFrontmatter(raw);
  const data = parseFrontmatter(frontmatter);

  if (!body) {
    throw new Error(`${sourcePath}: 케이스 본문이 비어 있습니다.`);
  }

  const id = requireString(data, "id", sourcePath);
  const track = requireString(data, "track", sourcePath);

  if (track === "review") {
    const expect = requireString(data, "expect", sourcePath);
    if (expect !== "violation" && expect !== "pass") {
      throw new Error(`${sourcePath}: expect는 "violation" 또는 "pass"여야 합니다.`);
    }
    const rule = requireString(data, "rule", sourcePath);
    return { track: "review", id, expect, rule, prompt: body, sourcePath };
  }

  if (track === "qa") {
    const must = optionalStringArray(data, "must");
    if (must.length === 0) {
      throw new Error(`${sourcePath}: frontmatter에 "must" 리스트가 최소 1개 필요합니다.`);
    }
    const mustNot = optionalStringArray(data, "must_not");
    const falsePremise = data.false_premise === true;
    return { track: "qa", id, must, mustNot, falsePremise, prompt: body, sourcePath };
  }

  throw new Error(`${sourcePath}: 알 수 없는 track "${track}" (review 또는 qa만 가능합니다).`);
}
