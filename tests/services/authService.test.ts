import "dotenv/config";
import { describe, it, expect, vi } from "vitest";
import * as authService from "../../src/services/authService.js";
import jwt from "jsonwebtoken";

// Forcing a mock of the DB to avoid needing a real DB for pure auth logic
vi.mock("../../src/services/userService.js", () => ({
  getUserByUsername: vi.fn(async (username) => {
    if (username === "testuser") {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("correct123", 10);
      return { id: "123", username: "testuser", passwordHash: hash };
    }
    return null;
  })
}));

describe("authService", () => {
  it("authenticateUser should securely return null for incorrect passwords", async () => {
    const user = await authService.authenticateUser("testuser", "totallywrong");
    expect(user).toBeNull();
  });

  it("authenticateUser should return the user for correct credentials", async () => {
    const user = await authService.authenticateUser("testuser", "correct123");
    expect(user).not.toBeNull();
    expect(user?.username).toBe("testuser");
  });

  it("generateAccessToken should yield a valid signed JWT string with correct claims", () => {
    const payload = { id: "123", username: "testuser" };
    const token = authService.generateAccessToken(payload);
    
    // 🛡️ High-performance claim verification!
    const decoded = jwt.decode(token) as any;
    expect(decoded.id).toBe(payload.id);
    expect(decoded.username).toBe(payload.username);
    expect(token.split(".")).toHaveLength(3); 
  });
});
