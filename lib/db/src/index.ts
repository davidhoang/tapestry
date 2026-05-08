import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer PRODUCTION_DATABASE_URL when set so prod can override the
// DATABASE_URL the Replit Postgres integration auto-injects (which uses an
// internal "helium" hostname unreachable from the deployed app).
const connectionString =
  process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or PRODUCTION_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
