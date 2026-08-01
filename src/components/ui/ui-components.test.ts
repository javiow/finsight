import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const uiDirectory = resolve(process.cwd(), "src/components/ui");
const configurationPath = resolve(process.cwd(), "components.json");
const componentFiles = [
  "button.tsx",
  "input.tsx",
  "select.tsx",
  "checkbox.tsx",
  "switch.tsx",
  "badge.tsx",
  "dialog.tsx",
  "tabs.tsx",
  "tooltip.tsx",
  "sonner.tsx",
];

describe("shadcn UI components", () => {
  it("keeps CSS variables and the shared component alias configured", () => {
    const configuration = JSON.parse(readFileSync(configurationPath, "utf8")) as {
      tailwind: { cssVariables: boolean };
      aliases: { components: string };
    };

    expect(configuration.tailwind.cssVariables).toBe(true);
    expect(configuration.aliases.components).toBe("@/components");
  });

  it("provides every component required by the design system", () => {
    for (const componentFile of componentFiles) {
      expect(existsSync(resolve(uiDirectory, componentFile))).toBe(true);
    }
  });

  it("uses design tokens instead of raw colors or Tailwind palette colors", () => {
    const forbiddenColor =
      /(?:#[0-9a-fA-F]{3,8}\b|(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|zinc|neutral|gray|stone|white|black)(?:-|\b))/;

    for (const componentFile of componentFiles) {
      const source = readFileSync(resolve(uiDirectory, componentFile), "utf8");
      expect(source).not.toMatch(forbiddenColor);
    }
  });
});
