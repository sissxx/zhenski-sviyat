import { execSync } from "node:child_process";

/**
 * Settings for the database tests: TEST_SUPABASE_URL, TEST_SUPABASE_PUBLISHABLE_KEY and TEST_SUPABASE_SECRET_KEY.
 * When they aren't set, they are read once from the running local Supabase (`supabase status`) and kept in
 * process.env, so the Playwright workers and `next start` get the same values.
 *
 * Deliberately not read from NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY: a developer's shell or
 * .env.local may point at the live project, and these tests create users and data.
 */

if (!process.env.TEST_SUPABASE_URL || !process.env.TEST_SUPABASE_PUBLISHABLE_KEY || !process.env.TEST_SUPABASE_SECRET_KEY) {
  let status: string;
  try {
    status = execSync("npx --yes supabase@2.121.0 status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    throw new Error("No local Supabase is running. Start it with `npm run db:start` (see docs/testing.md).");
  }
  const values = Object.fromEntries(
    status.split("\n").flatMap((line) => {
      const match = /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim());
      return match ? [[match[1], match[2]]] : [];
    }),
  );
  process.env.TEST_SUPABASE_URL ||= values.API_URL;
  process.env.TEST_SUPABASE_PUBLISHABLE_KEY ||= values.PUBLISHABLE_KEY;
  process.env.TEST_SUPABASE_SECRET_KEY ||= values.SECRET_KEY;
}

const url = process.env.TEST_SUPABASE_URL ?? "";
const host = URL.canParse(url) ? new URL(url).hostname : "";
if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(host)) {
  throw new Error(`Database tests only run against a local Supabase, not "${url}". Start one with \`npm run db:start\`.`);
}

export const supabaseTestUrl = url;
export const publishableKey = process.env.TEST_SUPABASE_PUBLISHABLE_KEY!;
export const secretKey = process.env.TEST_SUPABASE_SECRET_KEY!;

/** Placeholder Stripe test settings: card options show, and the tests sign webhook events with this secret. */
export const stripeWebhookSecret = "whsec_local_database_tests";

/** Environment for `next build` and `next start` in the database tests. */
export const testEnv: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseTestUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  SUPABASE_SECRET_KEY: secretKey,
  STRIPE_SECRET_KEY: "sk_test_local_database_tests",
  STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
  STRIPE_ALLOW_LIVE: "",
  // No Brevo: emails are logged as skipped in email_log instead of being sent.
  BREVO_API_KEY: "",
  EMAIL_FROM_ADDRESS: "",
  NEXT_PUBLIC_SITE_URL: "",
};
