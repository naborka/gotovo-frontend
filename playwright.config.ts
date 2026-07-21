import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const MOCK_PORT = 4000;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Dev-mode route compilation under parallel workers can push first
  // navigations past the 5s default.
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node tests/e2e/fixtures/api-server.mjs',
      port: MOCK_PORT,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      env: { MOCK_API_PORT: String(MOCK_PORT) },
      timeout: 30_000,
    },
    {
      command: process.env.E2E_PROD ? 'pnpm build && pnpm start' : 'pnpm dev',
      port: PORT,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        NEXT_PUBLIC_API_BASE_URL: `http://localhost:${MOCK_PORT}/v1`,
        NEXT_PUBLIC_SEARCH_ENABLED: 'false',
        NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      },
      timeout: 180_000,
    },
  ],
});
