import { defineConfig, devices } from "@playwright/test";
import { cookieNoticeClosed } from "./tests/cookie-notice";
import { fakeBrevoPort, fakeBrevoUrl, testEnv } from "./tests/db/env";

/**
 * Database tests: the real pages against a local Supabase started with `npx supabase start`, which applies
 * supabase/migrations and supabase/seed.sql. Build with the same settings first (`npm run test:db:build`),
 * because Next.js puts the NEXT_PUBLIC_ values into the browser code at build time. See docs/testing.md.
 *
 * tests/db/env.ts refuses any Supabase that isn't on this machine, so the live project is never touched.
 * Stripe runs with a placeholder test key: the tests sign webhook events themselves and never call Stripe.
 * Emails go to a local stand-in for Brevo (tests/db/fake-brevo.ts), so the tests can read what was sent.
 */
const port = Number(process.env.E2E_DB_PORT ?? 3200);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/db",
  globalSetup: "./tests/db/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never", outputFolder: "playwright-report-db" }]] : "list",
  outputDir: "test-results-db",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    baseURL: `http://localhost:${port}`,
    // The cookie notice is fixed at the bottom and would cover buttons; tests/e2e/cookie-notice.spec.ts checks it.
    storageState: cookieNoticeClosed(`http://localhost:${port}`),
    locale: "bg-BG",
    timezoneId: "Europe/Sofia",
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  webServer: [
    {
      command: `node --experimental-strip-types --no-warnings tests/db/fake-brevo.ts ${fakeBrevoPort}`,
      url: fakeBrevoUrl,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run start -- -p ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: testEnv,
    },
  ],
});
