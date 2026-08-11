import { describe, expect, it } from "vitest";

import { JUDGE_MODEL, SUBJECT_MODEL } from "../lib/models.ts";

describe("모델 상수", () => {
  it("SUBJECT_MODEL과 JUDGE_MODEL이 정의되어 있다", () => {
    expect(SUBJECT_MODEL).toBeTruthy();
    expect(JUDGE_MODEL).toBeTruthy();
  });

  it("judge는 subject와 다른 모델이어야 한다 (자기 채점 편향 방지)", () => {
    expect(JUDGE_MODEL).not.toBe(SUBJECT_MODEL);
  });
});
