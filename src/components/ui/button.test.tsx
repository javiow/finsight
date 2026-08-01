import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

afterEach(cleanup);

describe("Button", () => {
  it("renders as a button and calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>업로드</Button>);

    const button = screen.getByRole("button", { name: "업로드" });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        업로드
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "업로드" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant and size classes", () => {
    render(
      <Button variant="destructive" size="sm">
        삭제
      </Button>
    );

    const button = screen.getByRole("button", { name: "삭제" });
    expect(button.className).toContain("bg-destructive/10");
    expect(button.className).toContain("h-7");
  });
});
