import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ms from "ms";
import * as userService from "./userService";
import { MESSAGES } from "../constants/messages";
import { db } from "../db/connection";
import { refreshTokens } from "../db/schema";
import { eq } from "drizzle-orm";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("FATAL: JWT Secrets are completely missing from .env!");
}

export const authenticateUser = async (username: string, password: string) => {
  const user = await userService.getUserByUsername(username);

  if (!user || !user.passwordHash) {
    return null;
  }

  const match = await bcrypt.compare(password, user.passwordHash);

  if (match) {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  return null;
};

export const generateAccessToken = (user: any) => {
  const expiry = process.env.ACCESS_TOKEN_EXPIRY || "15m";
  return jwt.sign(user, ACCESS_TOKEN_SECRET as string, {
    expiresIn: expiry as any,
  });
};

export const generateRefreshToken = async (user: any) => {
  const expiry = process.env.REFRESH_TOKEN_EXPIRY || "7d";
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username },
    REFRESH_TOKEN_SECRET as string,
    { expiresIn: expiry as any },
  );

  // Parse exact milliseconds elegantly directly from the Dotenv Configuration string
  const expiryMs = ms(expiry as any);
  if (!expiryMs)
    throw new Error(`${MESSAGES.AUTH.INVALID_TOKEN_EXPIRY}${expiry}`);

  const expiresAt = new Date(Date.now() + expiryMs);

  // Directly insert the token record securely into PostgreSQL!
  await db.insert(refreshTokens).values({
    token: refreshToken,
    userId: user.id,
    used: false,
    expiresAt: expiresAt.toISOString(), // Drizzle inherently formats JS Dates perfectly matching mode: 'date' in Schema
  });

  return refreshToken;
};

export const invalidateAllTokensForUser = async (userId: string) => {
  // One mathematically flawless SQL command to literally wipe all parallel login sessions globally!
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
};

export const verifyRefreshToken = async (token: string) => {
  // Check the physical database strictly!
  const result = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));
  const tokenData = result[0];

  if (!tokenData) {
    return { valid: false, user: null, message: MESSAGES.AUTH.TOKEN_NOT_FOUND };
  }

  if (new Date(tokenData.expiresAt).getTime() < Date.now()) {
    // A clean architectural safety net ensuring Postgres expired timestamps are correctly mapped to HTTP 401s
    return {
      valid: false,
      user: null,
      message: MESSAGES.AUTH.INVALID_OR_EXPIRED_TOKEN,
    };
  }

  if (tokenData.used) {
    // If a Hacker steals a used token, their first try instantly logs BOTH of you out!
    await invalidateAllTokensForUser(tokenData.userId);
    return {
      valid: false,
      user: null,
      message: MESSAGES.AUTH.TOKEN_REUSE_DETECTED,
    };
  }

  try {
    const payload = jwt.verify(
      token,
      REFRESH_TOKEN_SECRET as string,
    ) as jwt.JwtPayload;
    const user = await userService.getUserById(payload.id as string);
    return { valid: true, user };
  } catch (err) {
    return {
      valid: false,
      user: null,
      message: MESSAGES.AUTH.INVALID_OR_EXPIRED_TOKEN,
    };
  }
};

export const markTokenAsUsed = async (token: string) => {
  await db
    .update(refreshTokens)
    .set({ used: true })
    .where(eq(refreshTokens.token, token));
};

export const removeRefreshToken = async (token: string) => {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
};
