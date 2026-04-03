import SchemaBuilder from '@pothos/core';
import ValidationPlugin from '@pothos/plugin-validation';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import { Request, Response } from 'express';
import { SmartRedis } from "../services/redisService";
import { GraphQLError } from "graphql";
import { MESSAGES } from "../constants/messages";

// We register exactly ONE instance of the Validation engine globally!
export const builder = new SchemaBuilder<{
  Context: { 
    req: Request; 
    res: Response;
    user?: any;
    redis: SmartRedis;
    isTokenExpired?: boolean;
  };
  AuthScopes: {
    auth: boolean;
  };
}>({
  plugins: [ScopeAuthPlugin, ValidationPlugin],
  scopeAuth: {
    authScopes: async (context) => {
      // If a token was provided BUT it's expired, we throw explicitly using a formatted GraphQLError!
      if (context.isTokenExpired) {
        throw new GraphQLError(`${MESSAGES.AUTH.UNAUTHENTICATED}: Token has naturally expired.`, {
          extensions: { code: MESSAGES.AUTH.UNAUTHENTICATED },
        });
      }
      return {
        // Otherwise, standard check if user exists
        auth: !!context.user,
      };
    },
  }
});
