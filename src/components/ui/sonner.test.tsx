import "@testing-library/jest-dom/vitest";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";

import { Toaster } from "@/components/ui/sonner";

afterEach(cleanup);

it("keeps notifications in FinSight's fixed dark theme", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/ui/sonner.tsx"), "utf8");

  expect(source).toContain('theme="dark"');
  expect(source).not.toContain('from "next-themes"');
});

describe("Toaster", () => {
  it("renders a toast message triggered via toast()", async () => {
    render(<Toaster />);

    toast("업로드가 완료되었습니다.");

    expect(await screen.findByText("업로드가 완료되었습니다.")).toBeVisible();
  });
});
