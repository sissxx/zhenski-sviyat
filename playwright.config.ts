import { defineConfig, devices } from "@playwright/test";
import { cookieNoticeClosed } from "./tests/cookie-notice";

/**
 * Smoke tests against a production build (`npm run build` first). They run without Supabase, Stripe or Brevo
 * settings, so they cover the public pages and what visitors see before the services answer.
 *
 * PLAYWRIGHT_CHROMIUM_PATH points at an already installed Chromium when `npx playwright install` isn't possible.
 */
const port = Number(process.env.E2E_PORT ?? 3100);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    // The cookie notice is fixed at the bottom and would cover buttons; tests/e2e/cookie-notice.spec.ts checks it.
    storageState: cookieNoticeClosed(`http://localhost:${port}`),
    locale: "bg-BG",
    timezoneId: "Europe/Sofia",
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // The smoke tests must not depend on real services, even when a developer has .env.local.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
      STRIPE_SECRET_KEY: "",
      BREVO_API_KEY: "",
    },
  },
});
