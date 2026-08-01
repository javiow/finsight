import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Checkbox } from "@/components/ui/checkbox";

afterEach(cleanup);

describe("Checkbox", () => {
  it("starts unchecked and toggles to checked on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="자동 분류 동의" onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "자동 분류 동의" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");

    await user.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox aria-label="자동 분류 동의" disabled onCheckedChange={onCheckedChange} />
    );

    await user.click(screen.getByRole("checkbox", { name: "자동 분류 동의" }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
