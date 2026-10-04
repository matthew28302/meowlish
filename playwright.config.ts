import { defineConfig } from '@playwright/test';

// Smoke suite runs against the ALREADY-RUNNING dev server
// (http://localhost:3000). This config never starts its own server.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
