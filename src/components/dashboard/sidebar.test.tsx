import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

import { Sidebar } from "./sidebar";

afterEach(cleanup);

describe("Sidebar", () => {
  it("대시보드·거래 내역·월별 추이 3개 항목만 노출한다(업로드 항목 제외)", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "대시보드" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "거래 내역" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "월별 추이" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "업로드" })).not.toBeInTheDocument();
  });

  it("현재 경로에 해당하는 항목만 활성 스타일을 갖는다", () => {
    usePathnameMock.mockReturnValue("/transactions");

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "거래 내역" }).className).toContain(
      "text-[var(--color-primary)]",
    );
    expect(screen.getByRole("link", { name: "대시보드" }).className).not.toContain(
      "text-[var(--color-primary)]",
    );
  });
});
