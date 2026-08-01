import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";

afterEach(cleanup);

describe("Badge", () => {
  it("renders as a span with the default variant's classes", () => {
    render(<Badge>결제 완료</Badge>);

    const badge = screen.getByText("결제 완료");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("bg-primary");
  });

  it("applies the requested variant's classes", () => {
    render(<Badge variant="destructive">연체</Badge>);

    expect(screen.getByText("연체").className).toContain("bg-destructive/10");
  });

  it("renders through a custom element via the render prop", () => {
    render(<Badge render={<a href="/transactions">거래 보기</a>} />);

    const link = screen.getByRole("link", { name: "거래 보기" });
    expect(link.tagName).toBe("A");
    expect(link.className).toContain("bg-primary");
  });
});
