import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Input } from "@/components/ui/input";

afterEach(cleanup);

describe("Input", () => {
  it("accepts typed input", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="가맹점명 검색" />);

    const input = screen.getByRole("textbox", { name: "가맹점명 검색" });
    await user.type(input, "스타벅스");

    expect(input).toHaveValue("스타벅스");
  });

  it("does not accept input when disabled", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="가맹점명 검색" disabled />);

    const input = screen.getByRole("textbox", { name: "가맹점명 검색" });
    await user.type(input, "스타벅스");

    expect(input).toHaveValue("");
    expect(input).toBeDisabled();
  });
});
