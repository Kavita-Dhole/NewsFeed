import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

// Neon serverless terminates idle connections without warning.
// Without this listener the unhandled 'error' event crashes the process.
pool.on("error", (err) => {
  console.error("PostgreSQL pool error (connection terminated by server):", err.message);
});

export const db = drizzle(pool, { schema });
