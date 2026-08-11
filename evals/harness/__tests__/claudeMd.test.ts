import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { extractCriticalRules } from "../lib/claudeMd.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

describe("extractCriticalRules", () => {
  it("'- CRITICAL:'로 시작하는 줄만 추출한다", () => {
    const markdown = [
      "## 아키텍처 규칙",
      "",
      "- CRITICAL: 첫 번째 규칙",
      "- 일반 규칙은 무시한다",
      "- CRITICAL: 두 번째 규칙",
      "",
      "## 다른 섹션",
      "- CRITICAL: 세 번째 규칙",
    ].join("\n");

    expect(extractCriticalRules(markdown)).toEqual([
      "CRITICAL: 첫 번째 규칙",
      "CRITICAL: 두 번째 규칙",
      "CRITICAL: 세 번째 규칙",
    ]);
  });

  it("CRITICAL 줄이 없으면 빈 배열을 반환한다", () => {
    expect(extractCriticalRules("# 제목\n\n일반 텍스트만 있음")).toEqual([]);
  });

  it("줄 앞뒤 공백은 무시한다", () => {
    const markdown = "   -   CRITICAL: 들여쓰기 된 규칙   ";
    expect(extractCriticalRules(markdown)).toEqual(["CRITICAL: 들여쓰기 된 규칙"]);
  });

  it("실제 프로젝트 CLAUDE.md에서 CRITICAL 규칙을 하나 이상 추출한다", () => {
    const claudeMd = readFileSync(path.join(PROJECT_ROOT, "CLAUDE.md"), "utf-8");
    const rules = extractCriticalRules(claudeMd);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(rule.startsWith("CRITICAL:")).toBe(true);
    }
  });
});
