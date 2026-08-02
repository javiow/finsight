// @vitest-environment node
import { describe, expect, it } from "vitest";

import { decodeCsvBuffer } from "./encoding";

describe("decodeCsvBuffer", () => {
  it("순수 UTF-8 버퍼는 그대로 디코딩하고 encoding을 utf-8로 표시한다", () => {
    const buffer = new TextEncoder().encode("가맹점,금액\n스타벅스,4500").buffer;

    const result = decodeCsvBuffer(buffer);

    expect(result.encoding).toBe("utf-8");
    expect(result.text).toBe("가맹점,금액\n스타벅스,4500");
  });

  it("UTF-8 BOM을 제거한다", () => {
    const bom = [0xef, 0xbb, 0xbf];
    const body = Array.from(new TextEncoder().encode("헤더,값"));
    const buffer = new Uint8Array([...bom, ...body]).buffer;

    const result = decodeCsvBuffer(buffer);

    expect(result.text).toBe("헤더,값");
  });

  it("UTF-8로 디코딩할 수 없는 버퍼는 CP949(EUC-KR)로 폴백한다", () => {
    // "가"의 EUC-KR 바이트 표현
    const buffer = new Uint8Array([0xb0, 0xa1]).buffer;

    const result = decodeCsvBuffer(buffer);

    expect(result.encoding).toBe("cp949");
    expect(result.text).toBe("가");
  });
});
