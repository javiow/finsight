import "@testing-library/jest-dom/vitest";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

afterEach(cleanup);

it("uses a design token for the dialog overlay color", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/ui/dialog.tsx"), "utf8");

  expect(source).toContain("bg-foreground/10");
  expect(source).not.toContain("bg-black/10");
});

describe("Dialog", () => {
  it("opens and shows its content when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>명세서 삭제</DialogTrigger>
        <DialogContent>
          <DialogTitle>정말 삭제할까요?</DialogTitle>
          <DialogDescription>이 작업은 되돌릴 수 없습니다.</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText("정말 삭제할까요?")).not.toBeInTheDocument();

    await user.click(screen.getByText("명세서 삭제"));

    expect(await screen.findByText("정말 삭제할까요?")).toBeVisible();
  });

  it("closes when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>정말 삭제할까요?</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await screen.findByText("정말 삭제할까요?");
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByText("정말 삭제할까요?")).not.toBeInTheDocument();
  });
});
