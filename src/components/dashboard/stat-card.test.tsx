import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatCard } from "./stat-card";

afterEach(cleanup);

describe("StatCard", () => {
  it("label과 value를 렌더한다", () => {
    render(<StatCard label="총 지출" value="₩1,234,000" />);

    expect(screen.getByText("총 지출")).toBeInTheDocument();
    expect(screen.getByText("₩1,234,000")).toBeInTheDocument();
  });

  it("tone:success면 delta에 success 색을 적용한다", () => {
    render(<StatCard label="총 지출" value="₩1,234,000" delta="+12%" tone="success" />);

    expect(screen.getByText("+12%").className).toContain("text-[var(--color-success)]");
  });

  it("tone:danger면 delta에 danger 색을 적용한다", () => {
    render(<StatCard label="총 지출" value="₩1,234,000" delta="-8%" tone="danger" />);

    expect(screen.getByText("-8%").className).toContain("text-[var(--color-danger)]");
  });
});
