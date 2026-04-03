import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { users } from '../db/schema';

export const getAllUsers = async (requestedFields?: string[]) => {
  
  // 1. If we don't know what they asked for, safely grab everything except the password
  if (!requestedFields || requestedFields.length === 0) {
    return await db.select({
      id: users.id, email: users.email, username: users.username,
      displayName: users.displayName, isActive: users.isActive,
      role: users.role, createdAt: users.createdAt, lastLoginAt: users.lastLoginAt
    }).from(users);
  }

  // 2. The Truly Optimized Dynamic Query Builder!
  const perfectlyOptimizedQuery: any = {};
  
  // We loop exactly through the Words the Frontend typed (like "email")
  requestedFields.forEach((field) => {
    // We check if that word physically exists in your Postgres schema map
    if (field in users) {
      // We map the string "email" directly to the real Postgres column `users.email`!
      perfectlyOptimizedQuery[field] = (users as any)[field];
    }
  });

  // 3. We send the perfectly tiny, completely filtered SQL string to Postgres!
  // It literally creates: SELECT username, email FROM users;
  return await db.select(perfectlyOptimizedQuery).from(users);
};

export const getUserById = async (id: string) => {
  const result = await db.select().from(users).where(eq(users.id, id));
  if (result.length > 0) {
    const { passwordHash, ...userWithoutPassword } = result[0];
    return userWithoutPassword;
  }
  return null;
};

export const getUserByUsername = async (username: string, requestedFields?: string[]) => {
  // If no fields are requested (e.g., our Legacy REST Auth Route calls this function),
  // we must securely fall back to pulling the entire heavy object including passwordHash!
  if (!requestedFields || requestedFields.length === 0) {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0] || null;
  }

  // The Dynamically Optimized Drizzle Query
  const perfectlyOptimizedQuery: any = {};
  
  requestedFields.forEach((field) => {
    // Only fetch exactly what GraphQL authorized and mapped to prevent SQL crashes
    if (field in users) {
      perfectlyOptimizedQuery[field] = (users as any)[field];
    }
  });

  // Physically executes the tiny string: SELECT username, email FROM users WHERE username = 'sandeep';
  const result = await db.select(perfectlyOptimizedQuery).from(users).where(eq(users.username, username));
  
  return result[0] || null;
};

export type UserInsertType = typeof users.$inferInsert;

export const addUser = async (userData: UserInsertType) => {
  // Map arguments strictly to Postgres columns using inferInsert
  const result = await db.insert(users).values(userData).returning();
  
  // Destructure to permanently strip the passwordHash before returning back down
  const { passwordHash: _, ...userWithoutPassword } = result[0];
  
  return userWithoutPassword;
};
