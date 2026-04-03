import "dotenv/config";
import express from "express";
import { applyMiddlewares } from "./src/middlewares/setup";
import {
  notFoundMiddleware,
  globalErrorMiddleware,
} from "./src/middlewares/errorHandler";
import { startApolloServer } from "./src/graphql/apolloServer";
import { redisInstance } from "./src/services/redisService";
import { pool } from "./src/db/connection";

// Exported explicitly for Supertest/Vitest architecture seamlessly without port collision!
export const app = express();
const port = process.env.PORT || 3000;

const startServer = async () => {
  // 1. Apply all global configuration/middlewares in one elegant sweep!
  applyMiddlewares(app);

  // 2. Root healthcheck endpoint
  app.get("/", (req, res) => {
    res.send("WELCOME TO NODE API - POWERED ENTIRELY BY GRAPHQL!");
  });

  // 3. Bind GraphQL to the existing Express App safely
  await startApolloServer(app);

  // 4. Catch invalid physical URL routes (404)
  app.use(notFoundMiddleware);

  // 5. Catch application crashes globally
  app.use(globalErrorMiddleware);

  // 6. Physically boot the listener exactly once!
  const server = app.listen(port, () => {
    console.log(`🚀 Base Server is running on port ${port}`);
    console.log(
      `🚀 GraphQL API perfectly live at http://localhost:${port}/graphql`,
    );
  });

  // 7. Industry Standard: Graceful Shutdown
  // This ensures that when the server stops, all physical connections are severed cleanly.
  const shutdown = async () => {
    console.log("\n[SHUTDOWN] Starting graceful logout...");
    server.close(async () => {
      try {
        if (redisInstance) {
          await redisInstance.quit();
          console.log("[REDIS] Connection closed.");
        }
        await pool.end();
        console.log("[POSTGRES] Connection pool drained.");
        process.exit(0);
      } catch (err) {
        console.error("[SHUTDOWN] Error during cleanup:", err);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((err) =>
  console.error("Critical Failure Booting Server:", err),
);
