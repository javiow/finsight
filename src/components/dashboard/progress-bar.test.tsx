import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProgressBar } from "./progress-bar";

afterEach(cleanup);

describe("ProgressBar", () => {
  it("label과 진행률을 반영한 progressbar를 렌더한다", () => {
    render(<ProgressBar label="분류하는 중" value={30} max={100} />);

    expect(screen.getByText("분류하는 중")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("value가 max를 넘지 않도록 폭을 100%로 제한한다", () => {
    render(<ProgressBar label="완료" value={120} max={100} />);

    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });
});
