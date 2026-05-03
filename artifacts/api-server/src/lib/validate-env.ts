import { logger } from "./logger";

const INTERNAL_DB_HOSTNAMES = ["helium", "hydrogen", "neon", "localhost", "127.0.0.1"];

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    const m = url.match(/@([^/:?]+)[:/?]/);
    return m ? m[1] : null;
  }
}

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === "production";
  const env = isProd ? "production" : "development";

  const dbUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;
  const dbUrlSource = process.env.PRODUCTION_DATABASE_URL
    ? "PRODUCTION_DATABASE_URL"
    : "DATABASE_URL";
  const pk = process.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dbUrl) {
    errors.push("Neither PRODUCTION_DATABASE_URL nor DATABASE_URL is set.");
  } else if (isProd) {
    const host = extractHostname(dbUrl);
    if (host && INTERNAL_DB_HOSTNAMES.some((h) => host === h || host.startsWith(`${h}.`))) {
      errors.push(
        `${dbUrlSource} points at an internal/dev hostname ("${host}") that is not reachable from production. ` +
          `Set a PRODUCTION_DATABASE_URL deployment secret to the external Postgres connection string ` +
          `(this overrides the DATABASE_URL the Replit Postgres integration auto-injects).`,
      );
    }
  }

  if (!pk) errors.push("VITE_CLERK_PUBLISHABLE_KEY is not set.");
  if (!sk) errors.push("CLERK_SECRET_KEY is not set.");

  const pkKind = pk.startsWith("pk_live_") ? "live" : pk.startsWith("pk_test_") ? "test" : "unknown";
  const skKind = sk.startsWith("sk_live_") ? "live" : sk.startsWith("sk_test_") ? "test" : "unknown";

  if (pkKind !== skKind && pkKind !== "unknown" && skKind !== "unknown") {
    errors.push(
      `Clerk key mismatch: publishable key is "${pkKind}" but secret key is "${skKind}". ` +
        `Both must come from the same Clerk instance.`,
    );
  }

  if (isProd && (pkKind === "test" || skKind === "test")) {
    errors.push(
      `Production deployment is using Clerk TEST keys (pk_test_/sk_test_). ` +
        `Set the live keys (pk_live_/sk_live_) as deployment secrets.`,
    );
  }

  if (!isProd && pkKind === "live") {
    warnings.push(
      "Workspace dev server is running with Clerk LIVE keys. " +
        "Set CLERK_DEV_PUBLISHABLE_KEY / CLERK_DEV_SECRET_KEY (pk_test_/sk_test_) as workspace secrets to use the test instance during development.",
    );
  }

  for (const w of warnings) {
    console.warn(`[env] WARN: ${w}`);
    logger.warn(w);
  }

  if (errors.length > 0) {
    const banner = `\n========== ENVIRONMENT MISCONFIGURATION (${env}) ==========`;
    console.error(banner);
    for (const e of errors) console.error(`[env] ERROR: ${e}`);
    console.error("=".repeat(banner.length - 1) + "\n");
    throw new Error(
      `Refusing to start in ${env} mode due to environment misconfiguration:\n  - ${errors.join("\n  - ")}`,
    );
  }

  console.log(
    `[env] Environment validated: env=${env} clerkInstance=${pkKind} dbSource=${dbUrlSource} dbHost=${dbUrl ? extractHostname(dbUrl) : "null"}`,
  );
  logger.info(
    {
      env,
      clerkInstance: pkKind,
      dbSource: dbUrlSource,
      dbHost: dbUrl ? extractHostname(dbUrl) : null,
    },
    "Environment validated",
  );
}
