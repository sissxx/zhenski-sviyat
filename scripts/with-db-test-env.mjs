// Runs a command with the database-test settings from tests/db/env.ts, e.g. `next build` before `npm run test:db`.
import { spawnSync } from "node:child_process";
import { testEnv } from "../tests/db/env.ts";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/with-db-test-env.mjs <command> [args...]");
  process.exit(2);
}

const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, ...testEnv } });
process.exit(result.status ?? 1);
