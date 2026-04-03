import { describe, it, expect, vi } from "vitest";

// Vitest currently struggles natively with resolving Apollo's inner ESM export graph safely.
// We strictly mock Apollo Server out entirely before importing the Express App so it tests pure Express logic cleanly!
vi.mock('../src/graphql/apolloServer.js', () => ({
  startApolloServer: vi.fn(),
}));

import request from "supertest";
import { app } from "../index.js"; 

describe("App Health Check", () => {
  it("GET / should return WELCOME TO NODE API", async () => {
    // Supertest simulates the HTTP request entirely in-memory!
    const response = await request(app).get("/");
    
    // Vitest assertions
    expect(response.status).toBe(200);
    expect(response.text).toBe("WELCOME TO NODE API - POWERED ENTIRELY BY GRAPHQL!");
  });

  it("GET /non-existent-route should return 404 JSON", async () => {
    const response = await request(app).get("/does-not-exist");
    
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Route Not Found: /does-not-exist");
    expect(response.body.success).toBe(false);
  });
});
