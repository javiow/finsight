import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureExceptionImmediateMock, shutdownMock, PostHogMock } = vi.hoisted(() => ({
  captureExceptionImmediateMock: vi.fn().mockResolvedValue(undefined),
  shutdownMock: vi.fn().mockResolvedValue(undefined),
  PostHogMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("posthog-node", () => ({
  PostHog: PostHogMock,
}));

import { reportServerError } from "./server";

describe("reportServerError", () => {
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
    PostHogMock.mockImplementation(() => ({
      captureExceptionImmediate: captureExceptionImmediateMock,
      shutdown: shutdownMock,
    }));
  });

  it("항상 원본 에러를 console.error로 남긴다", async () => {
    const error = new Error("boom");

    await reportServerError(error, { route: "POST /api/statements" });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("POST /api/statements"),
      error,
    );
  });

  it("PostHog 환경변수가 설정되어 있으면 captureExceptionImmediate로 예외를 전송하고 shutdown한다", async () => {
    const error = new Error("boom");

    await reportServerError(error, {
      route: "POST /api/statements",
      distinctId: "user-1",
      properties: { statementId: "stmt-1" },
    });

    expect(PostHogMock).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ host: "https://us.i.posthog.com" }),
    );
    expect(captureExceptionImmediateMock).toHaveBeenCalledWith(
      error,
      "user-1",
      expect.objectContaining({ route: "POST /api/statements", statementId: "stmt-1" }),
    );
    expect(shutdownMock).toHaveBeenCalled();
  });

  it("PostHog 환경변수가 없으면 예외 없이 조용히 건너뛴다", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    const error = new Error("boom");

    await expect(
      reportServerError(error, { route: "POST /api/statements" }),
    ).resolves.toBeUndefined();
    expect(PostHogMock).not.toHaveBeenCalled();
  });

  it("PostHog 캡처 자체가 실패해도 예외를 던지지 않는다", async () => {
    captureExceptionImmediateMock.mockRejectedValueOnce(new Error("network down"));
    const error = new Error("boom");

    await expect(
      reportServerError(error, { route: "POST /api/statements" }),
    ).resolves.toBeUndefined();
  });
});
