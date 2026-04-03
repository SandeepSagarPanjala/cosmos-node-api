import { relations } from "drizzle-orm/relations";
import { users, exoplanets, refreshTokens } from "./schema";

export const exoplanetsRelations = relations(exoplanets, ({one}) => ({
	user: one(users, {
		fields: [exoplanets.leadResearcherId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	exoplanets: many(exoplanets),
	refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));