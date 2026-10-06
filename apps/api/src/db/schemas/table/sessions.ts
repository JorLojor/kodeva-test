import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@/db/schemas/table/user";

export const sessions = pgTable(
	"sessions",
	{
		id: text("id").notNull().primaryKey(),
		userId: integer("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token").notNull(),
		refreshToken: text("refresh_token").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		refreshExpiresAt: timestamp("refresh_expires_at", { withTimezone: true }).notNull(),
	},
	(table) => [
		index("sessions_user_id_idx").on(table.userId),
		index("sessions_expires_at_idx").on(table.expiresAt),
		uniqueIndex("sessions_access_token_unique").on(table.accessToken),
		uniqueIndex("sessions_refresh_token_unique").on(table.refreshToken),
	],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
