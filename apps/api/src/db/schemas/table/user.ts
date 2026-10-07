import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { identifiers, timestamps } from "@/db/utils/common-table";
import { blog } from "./blog";
import { contentChangesLog } from "./content-change-log";

export const userRole = pgEnum("user_role", ["admin", "user"]);

export const user = pgTable(
	"user",
	{
		...identifiers(),
		username: text("username").notNull(),
		email: text("email").notNull(),
		password: text("password").notNull(),
		role: userRole("role").notNull().default("user"),
		...timestamps(),
	},
	(table) => {
		return {
			usernameIndex: uniqueIndex("user_username_unique").on(table.username),
			emailIndex: uniqueIndex("user_email_unique").on(table.email),
		};
	},
);

export const userRelations = relations(user, ({ many }) => ({
	contentChangesLogs: many(contentChangesLog),
	blogs: many(blog),
}));

export const publicUserFields = {
	publicId: user.publicId,
	username: user.username,
	email: user.email,
	role: user.role,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
};

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
