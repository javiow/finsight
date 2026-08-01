import { fileURLToPath } from "node:url";

import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    passWithNoTests: true,
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
});
