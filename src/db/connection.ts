import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// 1. Establish the Physical Connection Pool
// This intelligently manages dozens of concurrent database queries so your API handles maximum scale.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log(`[DB] Environment: ${process.env.NODE_ENV}`);

// 2. Wrap the pg Pool with Drizzle ORM
// This perfectly binds our TypeScript models strictly to the raw SQL connections
export const db = drizzle(pool, {
  // 🔥 Automatically disables SQL console noise in production environments!
  logger: process.env.NODE_ENV !== "production",
});
