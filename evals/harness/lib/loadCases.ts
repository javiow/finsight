import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { parseCase } from "./parser.ts";
import type { Case } from "./types.ts";

export function loadCasesFromDir(dir: string): Case[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const filePath = path.join(dir, name);
      return parseCase(readFileSync(filePath, "utf-8"), filePath);
    });
}

export function loadGoldenSet(casesRoot: string): Case[] {
  return [
    ...loadCasesFromDir(path.join(casesRoot, "review")),
    ...loadCasesFromDir(path.join(casesRoot, "qa")),
  ];
}
