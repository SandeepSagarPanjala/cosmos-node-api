import { builder } from "../builder";
import { users } from "../../db/schema";
import {
  getAllUsers,
  getUserByUsername,
  addUser,
} from "../../services/userService";
import { GraphQLResolveInfo } from "graphql";
import { z } from "zod";
import { VALIDATION_MESSAGES } from "../../constants/messages";
import { CACHE_KEYS } from "../../constants/cacheKeys";

export type UserType = typeof users.$inferSelect;

// 1. The Global Presence Object
export const UserObject = builder.objectRef<UserType>("User").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    username: t.exposeString("username"),
    email: t.exposeString("email", { nullable: true }),
    displayName: t.exposeString("displayName", { nullable: true }),
    role: t.exposeString("role", { nullable: true }),
    isActive: t.exposeBoolean("isActive", { nullable: true }),
  }),
});

// 2. We attach the Resolvers strictly tied to Users
builder.queryFields((t) => ({
  users: t.field({
    type: [UserObject],
    authScopes: { auth: true },
    resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
      // 🚀 Clean, Namespaced Key pull
      const CACHE_KEY = CACHE_KEYS.USERS.ALL;
      
      const cachedUsers = await ctx.redis.get<UserType[]>(CACHE_KEY);
      if (cachedUsers) {
        console.log(`[REDIS] Cache Hit for ${CACHE_KEY}`);
        return cachedUsers;
      }

      const data = await getAllUsers();
      await ctx.redis.set(CACHE_KEY, data, 3600);
      console.log(`[REDIS] Cache Miss. Populated ${CACHE_KEY}`);

      return data as UserType[];
    },
  }),

  user: t.field({
    type: UserObject,
    nullable: true,
    authScopes: { auth: true },
    args: { username: t.arg.string({ required: true }) },
    resolve: async (parent, args, ctx, info: GraphQLResolveInfo) => {
      // 🛡️ Safe dynamic key construction via factory!
      const CACHE_KEY = CACHE_KEYS.USERS.BY_USERNAME(args.username);
      
      const cached = await ctx.redis.get<UserType>(CACHE_KEY);
      if (cached) {
        console.log(`[REDIS] Cache Hit for ${CACHE_KEY}`);
        return cached;
      }

      const data = await getUserByUsername(args.username);
      if (data) {
        await ctx.redis.set(CACHE_KEY, data, 3600);
        console.log(`[REDIS] Cache Miss. Populated ${CACHE_KEY}`);
      }

      return data as UserType | null;
    },
  }),
}));

// 3. Attach Mutations
builder.mutationFields((t) => ({
  addUser: t.field({
    type: UserObject,
    args: {
      username: t.arg.string({
        required: true,
        validate: z.string().min(3, VALIDATION_MESSAGES.USER.USERNAME_MIN),
      }),
      email: t.arg.string({
        required: true,
        validate: z.string().email(VALIDATION_MESSAGES.USER.EMAIL_INVALID),
      }),
      password: t.arg.string({
        required: true,
        validate: z.string().min(6, VALIDATION_MESSAGES.USER.PASSWORD_MIN),
      }),
      displayName: t.arg.string({
        required: false,
        validate: z
          .string()
          .min(3, VALIDATION_MESSAGES.USER.DISPLAY_NAME_MIN)
          .optional(),
      }),
    },
    resolve: async (parent, args, ctx) => {
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(args.password, 10);

      const newUser = await addUser({
        username: args.username,
        email: args.email,
        displayName: args.displayName || args.username,
        passwordHash: hashedPassword,
      });

      // 🛡️ Reliable Invalidation - Typos now impossible!
      await ctx.redis.del(CACHE_KEYS.USERS.ALL);
      console.log(`[REDIS] Invalidated ${CACHE_KEYS.USERS.ALL}`);

      return newUser as UserType;
    },
  }),
}));
