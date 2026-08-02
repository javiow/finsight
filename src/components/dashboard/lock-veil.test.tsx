import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LockVeil } from "./lock-veil";

afterEach(cleanup);

describe("LockVeil", () => {
  it("제목과 설명, /pricing으로 가는 업그레이드 링크를 렌더한다", () => {
    render(<LockVeil title="월별 추이는 Pro 기능이에요" note="Pro로 업그레이드하면 볼 수 있어요" />);

    expect(screen.getByText("월별 추이는 Pro 기능이에요")).toBeInTheDocument();
    expect(screen.getByText("Pro로 업그레이드하면 볼 수 있어요")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Pro로 업그레이드" });
    expect(link).toHaveAttribute("href", "/pricing");
  });
});
