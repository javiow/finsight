import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Tooltip", () => {
  it("shows the tooltip content when the trigger is hovered", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>업로드 한도</TooltipTrigger>
          <TooltipContent>24시간 내 최대 3건까지 무료입니다.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.queryByText("24시간 내 최대 3건까지 무료입니다.")).not.toBeInTheDocument();

    await user.hover(screen.getByText("업로드 한도"));

    expect(
      await screen.findByText("24시간 내 최대 3건까지 무료입니다.")
    ).toBeVisible();
  });
});
