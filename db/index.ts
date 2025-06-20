import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(client, { schema });
