import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});
