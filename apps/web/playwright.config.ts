import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against the running dev app in demo mode. The in-memory store lives on
 * globalThis (src/lib/store.ts), so we run serially with a single worker to keep
 * shared state deterministic across specs.
 */
const PORT = process.env.E2E_PORT ?? "3100";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Force the in-memory demo store so E2E is deterministic (no external DB).
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { HERMES_FORCE_DEMO: "1" },
  },
});
