import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Ensures environment variables are loaded so we can read the DATABASE_URL securely
dotenv.config();

export default defineConfig({
  // The destination where Drizzle Kit will generate the TypeScript schemas after reading Postgres
  schema: "./src/db/schema.ts",

  // This is where Drizzle will save the history/diary of SQL files and snapshots
  out: "./src/db/migrations",

  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
