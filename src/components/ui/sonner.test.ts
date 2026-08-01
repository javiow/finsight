import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, it } from "vitest";

it("keeps notifications in FinSight's fixed dark theme", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/ui/sonner.tsx"), "utf8");

  expect(source).toContain('theme="dark"');
  expect(source).not.toContain('from "next-themes"');
});
