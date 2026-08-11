import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { initMock } = vi.hoisted(() => ({ initMock: vi.fn() }));

vi.mock("posthog-js", () => ({
  default: { init: initMock },
}));

beforeEach(() => {
  vi.resetModules();
  initMock.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("instrumentation-client", () => {
  it("프로젝트 토큰과 호스트가 있으면 posthog.init을 호출한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");

    await import("./instrumentation-client");

    expect(initMock).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ api_host: "https://us.i.posthog.com" }),
    );
  });

  it("개발 환경에서 환경변수가 없으면 초기화하지 않고 에러를 던진다", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    vi.stubEnv("NODE_ENV", "development");

    await expect(import("./instrumentation-client")).rejects.toThrow(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
    );
    expect(initMock).not.toHaveBeenCalled();
  });

  it("개발 환경이 아니면 환경변수가 없어도 조용히 넘어간다", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    vi.stubEnv("NODE_ENV", "production");

    await expect(import("./instrumentation-client")).resolves.toBeDefined();
    expect(initMock).not.toHaveBeenCalled();
  });
});
