// @ts-nocheck — config runs in Node; avoid widening jsconfig `types` to `node` (punycode noise).
import { defineConfig, devices } from '@playwright/test';

/**
 * Default matches Vite `server.port` (3000). Override:
 *   PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:e2e
 * Remote / Vercel (skip auto webServer):
 *   PLAYWRIGHT_BASE_URL=https://your-app.vercel.app PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

const isLocalHost = () => {
  try {
    const h = new URL(baseURL).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
};

const startWebServer =
  process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1' && isLocalHost();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 25_000 },
  use: {
    baseURL,
    viewport: { width: 1600, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: {} }],
  webServer: startWebServer
    ? {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
});
