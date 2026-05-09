import { defineConfig } from "drizzle-kit";
import path from "path";

// drizzle-kit (push/migrate) is a dev-time tool — always target the local
// dev DATABASE_URL unless the caller explicitly opts into prod by setting
// only PRODUCTION_DATABASE_URL (no DATABASE_URL).
const connectionString =
  process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or PRODUCTION_DATABASE_URL must be set; ensure the database is provisioned",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
