import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CategorySelect } from "./category-select";

beforeEach(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CategorySelect", () => {
  it("현재 카테고리를 트리거에 보여준다", () => {
    render(<CategorySelect transactionId="txn-1" category="식비" />);

    expect(screen.getByRole("combobox", { name: "카테고리" })).toHaveTextContent("식비");
  });

  it("다른 카테고리를 선택하면 PATCH /api/transactions/:id를 호출하고 onUpdated를 부른다", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    const onUpdated = vi.fn();
    const user = userEvent.setup();
    render(<CategorySelect transactionId="txn-1" category="식비" onUpdated={onUpdated} />);

    await user.click(screen.getByRole("combobox", { name: "카테고리" }));
    await user.click(await screen.findByRole("option", { name: "교통" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/transactions/txn-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ category: "교통" }),
      }),
    );
    expect(onUpdated).toHaveBeenCalledWith("교통");
  });

  it("요청이 실패하면 이전 카테고리로 되돌린다", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const user = userEvent.setup();
    render(<CategorySelect transactionId="txn-1" category="식비" />);

    await user.click(screen.getByRole("combobox", { name: "카테고리" }));
    await user.click(await screen.findByRole("option", { name: "교통" }));

    expect(await screen.findByRole("combobox", { name: "카테고리" })).toHaveTextContent("식비");
  });
});
