import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import posthog from "posthog-js";

import { InsightsSection } from "./insights-section";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const twoInsights = [
  { category: "식비" as const, period: "2026-01", message: "식비가 늘었어요" },
  { category: "교통" as const, period: "2026-01", message: "교통비는 안정적이에요" },
];

describe("InsightsSection", () => {
  it("마운트 시 POST /api/insights를 호출한다", () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => twoInsights,
    } as Response);

    render(<InsightsSection initialInsights={twoInsights} plan="pro" />);

    expect(fetch).toHaveBeenCalledWith("/api/insights", { method: "POST" });
  });

  it("응답이 오면 최신 인사이트로 갱신한다", async () => {
    const updated = [{ category: "식비" as const, period: "2026-01", message: "갱신된 인사이트" }];
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => updated } as Response);

    render(<InsightsSection initialInsights={twoInsights} plan="pro" />);

    await waitFor(() => {
      expect(screen.getByText("갱신된 인사이트")).toBeInTheDocument();
    });
  });

  it("Free 플랜은 첫 인사이트만 노출하고 나머지는 잠금 안내를 보여준다", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => twoInsights } as Response);

    render(<InsightsSection initialInsights={twoInsights} plan="free" />);

    expect(await screen.findByText("식비가 늘었어요")).toBeInTheDocument();
    expect(screen.getByText("인사이트 1개가 더 있어요")).toBeInTheDocument();
  });

  it("Pro 플랜은 모든 인사이트를 잠금 없이 노출한다", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => twoInsights } as Response);

    render(<InsightsSection initialInsights={twoInsights} plan="pro" />);

    expect(await screen.findByText("식비가 늘었어요")).toBeInTheDocument();
    expect(screen.getByText("교통비는 안정적이에요")).toBeInTheDocument();
    expect(screen.queryByText(/더 있어요/)).not.toBeInTheDocument();
  });

  it("인사이트가 없으면 안내 문구를 보여준다", () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as Response);

    render(<InsightsSection initialInsights={[]} plan="free" />);

    expect(screen.getByText(/아직 인사이트를 만들 만한/)).toBeInTheDocument();
  });

  it("응답이 실패하면 posthog.captureException으로 보고하고 기존 인사이트를 유지한다", async () => {
    const captureExceptionSpy = vi
      .spyOn(posthog, "captureException")
      .mockImplementation(() => undefined);
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);

    render(<InsightsSection initialInsights={twoInsights} plan="pro" />);

    await waitFor(() => expect(captureExceptionSpy).toHaveBeenCalled());
    expect(screen.getByText("식비가 늘었어요")).toBeInTheDocument();

    captureExceptionSpy.mockRestore();
  });
});
