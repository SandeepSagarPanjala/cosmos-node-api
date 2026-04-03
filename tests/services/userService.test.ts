import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as userService from "../../src/services/userService.js";
import { db } from "../../src/db/connection.js";
import { users } from "../../src/db/schema.js";
import { eq } from "drizzle-orm";

describe("userService", () => {
  let testUserId: string;

  beforeAll(async () => {
    // 1. We mathematically seed a completely isolated Test User into Postgres!
    const result = await db.insert(users).values({
      username: "vitest_sandeep",
      email: "vitest_sandeep@example.com",
      passwordHash: "secure_hash_mock_123"
    }).returning();
    testUserId = result[0].id;
  });

  afterAll(async () => {
    // 2. We cleanly delete the user so we don't pollute the dev database
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("getUserByUsername should perfectly return the isolated test user", async () => {
    const user = await userService.getUserByUsername("vitest_sandeep");
    expect(user).toBeDefined();
    expect(user?.username).toBe("vitest_sandeep");
    expect(user?.passwordHash).toBeDefined(); 
  });

  it("getUserById should mathematically fail gracefully on non-existent mathematically valid UUIDs", async () => {
    // We physically pass a mathematically flawless Postgres UUID that we perfectly know does not exist!
    const user = await userService.getUserById("00000000-0000-0000-0000-000000000000");
    expect(user).toBeNull(); 
  });
});
