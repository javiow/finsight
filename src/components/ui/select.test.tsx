import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderSelect(onValueChange = vi.fn()) {
  render(
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="카테고리">
        <SelectValue placeholder="카테고리 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="food">식비</SelectItem>
        <SelectItem value="transport">교통</SelectItem>
      </SelectContent>
    </Select>
  );
  return onValueChange;
}

describe("Select", () => {
  it("opens the option list when the trigger is clicked", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("combobox", { name: "카테고리" }));

    expect(await screen.findByRole("option", { name: "식비" })).toBeVisible();
  });

  it("calls onValueChange with the selected option's value", async () => {
    const user = userEvent.setup();
    const onValueChange = renderSelect();

    await user.click(screen.getByRole("combobox", { name: "카테고리" }));
    await user.click(await screen.findByRole("option", { name: "교통" }));

    expect(onValueChange).toHaveBeenCalledWith("transport", expect.anything());
  });
});
