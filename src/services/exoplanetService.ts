import { db } from "../db/connection";
import { exoplanets } from "../db/schema";

export const getAllExoplanets = async (requestedFields?: string[]) => {
  // 1. Fallback for Legacy/Internal Server Calls
  if (!requestedFields || requestedFields.length === 0) {
    return await db.select().from(exoplanets);
  }

  // 2. The Drizzle AST Optimizer
  const perfectlyOptimizedQuery: any = {};

  requestedFields.forEach((field) => {
    if (field in exoplanets)
      perfectlyOptimizedQuery[field] = (exoplanets as any)[field];
  });

  // 3. Executes beautifully pruned SQL!
  return await db.select(perfectlyOptimizedQuery).from(exoplanets);
};

// Typescript perfectly infers the precise required INSERT fields for the table!
type ExoplanetInsertType = typeof exoplanets.$inferInsert;

export const addExoplanet = async (exoplanetData: ExoplanetInsertType) => {
  // Gracefully handles Postgres UUID generation natively!
  // `.returning()` guarantees we instantly get the exact new Database row back!
  const result = await db.insert(exoplanets).values(exoplanetData).returning();

  return result[0];
};
