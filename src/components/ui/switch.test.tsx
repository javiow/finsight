import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Switch } from "@/components/ui/switch";

afterEach(cleanup);

describe("Switch", () => {
  it("starts unchecked and toggles to checked on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Pro 트렌드 알림" onCheckedChange={onCheckedChange} />);

    const toggle = screen.getByRole("switch", { name: "Pro 트렌드 알림" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch aria-label="Pro 트렌드 알림" disabled onCheckedChange={onCheckedChange} />
    );

    await user.click(screen.getByRole("switch", { name: "Pro 트렌드 알림" }));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
