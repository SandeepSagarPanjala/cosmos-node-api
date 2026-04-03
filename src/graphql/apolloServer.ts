import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import { schema } from "./schema";
import jwt from "jsonwebtoken";
import { MESSAGES } from "../constants/messages";
import { redisInstance } from "../services/redisService";

// We isolate Apollo Startup to prevent breaking Supertest execution natively
export const startApolloServer = async (app: express.Application) => {
  const server = new ApolloServer({
    // We completely deleted typeDefs and resolvers!
    // We literally just hand Apollo the compiled Pothos RAM map!
    schema,
    // Fix: Ensure GraphQL Auth failures return a physical 401 Status code for the Interceptor!
    plugins: [
      {
        async requestDidStart() {
          return {
            async willSendResponse({ response, errors }) {
              // 🚀 Refined check: If ANY error is authentication related, force a 401!
              const hasAuthError = errors?.some(
                (e) =>
                  e.message.includes(MESSAGES.AUTH.UNAUTHENTICATED) ||
                  e.message.includes(MESSAGES.AUTH.NOT_AUTHORIZED) ||
                  e.extensions?.code === MESSAGES.AUTH.UNAUTHENTICATED,
              );

              if (hasAuthError && response.body.kind === "single") {
                response.http.status = 401;
              }
            },
          };
        },
      },
    ],
  });

  await server.start();

  // Attach GraphQL Endpoint onto Express pipeline and forward physical HTTP objects
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({
        req,
        res,
      }: {
        req: express.Request;
        res: express.Response;
      }) => {
        let currentUser = null;
        let isTokenExpired = false;

        // 1. The industry standard "Bearer" token extraction
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.split(" ")[1];
          try {
            // If the token is valid, we inject the decoded JWT payload into the Context!
            currentUser = jwt.verify(
              token,
              process.env.ACCESS_TOKEN_SECRET as string,
            );
          } catch (err: any) {
            // CRITICAL: We don't throw here to avoid breaking public mutations like Login.
            // Instead, we mark it as expired for Pothos to handle in AuthScopes!
            if (err.name === "TokenExpiredError") {
              isTokenExpired = true;
            }
          }
        }

        // 2. The entire GraphQL API now perfectly understands who is making the request globally!
        return {
          req,
          res,
          user: currentUser,
          isTokenExpired,
          redis: redisInstance,
        };
      },
    }),
  );

  return server;
};
