import { defineConfig } from "vitest/config";

// Unit tests live under src/. Playwright specs (e2e/) run via `pnpm e2e`, not vitest.
export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
