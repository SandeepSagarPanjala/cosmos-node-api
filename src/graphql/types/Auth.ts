import { builder } from '../builder';
import { authenticateUser, generateAccessToken, generateRefreshToken, verifyRefreshToken, markTokenAsUsed, removeRefreshToken } from '../../services/authService';
import { UserObject, UserType } from './User';
import { MESSAGES } from '../../constants/messages';
import ms from 'ms';

// 1. We create a beautiful Custom Interface returning BOTH a token and a full User simultaneously!
// This is natively impossible in standard REST without messy wrapper JSON!
interface AuthPayloadType {
  accessToken: string;
  user: UserType;
}

const AuthPayload = builder.objectRef<AuthPayloadType>('AuthPayload').implement({
  fields: (t) => ({
    accessToken: t.exposeString('accessToken'),
    user: t.field({
      type: UserObject,
      resolve: (parent) => parent.user,
    }),
  }),
});

// 2. We attach the Formations explicitly to Mutations!
builder.mutationFields((t) => ({
  loginUser: t.field({
    type: AuthPayload,
    args: {
      username: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (parent, args, ctx) => {
      // 1. Try to Authenticate exactly using your Legacy Business logic (Bcrypt compare)!
      const user = await authenticateUser(args.username, args.password);
      
      if (!user) {
        throw new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
      }
      
      // 2. Generate brand new Tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);

      // 3. MAGIC! Because we opened the Context Tunnel, we can directly set the legacy Express Cookie!
      const maxAgeMs = Number(ms((process.env.REFRESH_TOKEN_EXPIRY || "7d") as any));
      ctx.res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: maxAgeMs || (7 * 24 * 60 * 60 * 1000), // Perfect fallback
      });
      
      // 4. Return our newly created Pothos AuthPayload natively!
      return {
        accessToken,
        user: user as UserType,
      };
    }
  }),

  refreshSession: t.field({
    type: AuthPayload, // Instantly yields a fresh Access Token and current User object
    resolve: async (parent, args, ctx) => {
      // 1. Intercept the silent cookie
      const currentToken = ctx.req.cookies?.jwt;
      if (!currentToken) throw new Error("No active session detected globally.");

      // 2. Mathematically verify Drizzle Database
      const validation = await verifyRefreshToken(currentToken);
      if (!validation.valid || !validation.user) {
        throw new Error(validation.message || "Session invalidated due to corruption.");
      }

      const user = validation.user;

      // 3. Rotation: Flag the old one as completely dead to prevent replay attacks, generate a dynamic new one!
      await markTokenAsUsed(currentToken);
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = await generateRefreshToken(user);

      // 4. Inject the new Drizzle session directly into the user's browser physically!
      const maxAgeMs = Number(ms((process.env.REFRESH_TOKEN_EXPIRY || "7d") as any));
      ctx.res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: maxAgeMs || (7 * 24 * 60 * 60 * 1000), 
      });

      return {
        accessToken: newAccessToken,
        user: user as UserType,
      };
    }
  }),

  logoutUser: t.field({
    type: 'Boolean',
    resolve: async (parent, args, ctx) => {
      const currentToken = ctx.req.cookies?.jwt;
      if (currentToken) {
        // Purge the current token explicitly from the physical Postgres Table
        await removeRefreshToken(currentToken);
      }
      
      // Clear the user's physical browser memory
      ctx.res.clearCookie("jwt");
      return true; // Successfully logged out globally!
    }
  })
}));
