import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateGoldenSet } from "../lib/aggregate.ts";
import { loadCasesFromDir, loadGoldenSet } from "../lib/loadCases.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CASES_ROOT = path.resolve(__dirname, "..", "cases");

describe("loadCasesFromDir", () => {
  it("디렉토리의 .md 케이스 파일을 모두 파싱해서 반환한다", () => {
    const cases = loadCasesFromDir(path.join(CASES_ROOT, "review"));
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      expect(c.track).toBe("review");
    }
  });
});

describe("golden set 무결성 (실제 cases/ 디렉토리, 네트워크 없음)", () => {
  it("review + qa 골든셋을 로드하면 파싱 에러가 없다", () => {
    expect(() => loadGoldenSet(CASES_ROOT)).not.toThrow();
  });

  it("골든셋은 validateGoldenSet 기준(균형/무결성)을 통과한다", () => {
    const cases = loadGoldenSet(CASES_ROOT);
    const issues = validateGoldenSet(cases);
    expect(issues).toEqual([]);
  });

  it("review 트랙에는 violation 4개 이상과 오탐 방지용 pass가 최소 1개 있다", () => {
    const cases = loadGoldenSet(CASES_ROOT).filter((c) => c.track === "review");
    expect(cases.filter((c) => c.track === "review" && c.expect === "violation").length).toBeGreaterThanOrEqual(4);
    expect(cases.filter((c) => c.track === "review" && c.expect === "pass").length).toBeGreaterThanOrEqual(1);
  });

  it("qa 트랙에는 틀린 전제를 반박하는 케이스가 최소 1개 있다", () => {
    const cases = loadGoldenSet(CASES_ROOT).filter((c) => c.track === "qa");
    expect(cases.some((c) => c.track === "qa" && c.falsePremise)).toBe(true);
  });
});
