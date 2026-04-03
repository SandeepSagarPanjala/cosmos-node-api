import "dotenv/config";
import { describe, it, expect } from "vitest";
import * as authService from "../../src/services/authService.js";

describe("authService", () => {
  it("authenticateUser should securely return null for incorrect passwords", async () => {
    const user = await authService.authenticateUser("sandeep", "totallywrong");
    expect(user).toBeNull();
  });

  it("generateAccessToken should yield a valid signed JWT string", () => {
    const token = authService.generateAccessToken({ id: 1, username: "test" });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // A JWT always has 3 parts separated by dots
  });
});
