import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, it } from "vitest";

it("uses a design token for the dialog overlay color", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/ui/dialog.tsx"), "utf8");

  expect(source).toContain("bg-foreground/10");
  expect(source).not.toContain("bg-black/10");
});
