import { pgTable, unique, uuid, varchar, text, boolean, timestamp, foreignKey, date, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const users = pgTable("users", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: varchar({ length: 255 }),
	passwordHash: text("password_hash").notNull(),
	username: varchar({ length: 50 }).notNull(),
	displayName: varchar("display_name", { length: 100 }),
	isActive: boolean("is_active").default(true),
	role: varchar({ length: 20 }).default('user'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("users_email_key").on(table.email),
	unique("users_username_key").on(table.username),
]);

export const exoplanets = pgTable("exoplanets", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	scientificName: varchar("scientific_name", { length: 100 }),
	imageUrl: text("image_url"),
	discoveredOn: date("discovered_on"),
	discoveredBy: varchar("discovered_by", { length: 255 }),
	distanceFromEarthLy: numeric("distance_from_earth_ly", { precision: 15, scale:  2 }),
	solarSystemName: varchar("solar_system_name", { length: 100 }).default('Unknown'),
	leadResearcherId: uuid("lead_researcher_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.leadResearcherId],
			foreignColumns: [users.id],
			name: "exoplanets_lead_researcher_id_fkey"
		}).onDelete("set null"),
	unique("exoplanets_scientific_name_key").on(table.scientificName),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	token: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	used: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "refresh_tokens_user_id_fkey"
		}).onDelete("cascade"),
]);
