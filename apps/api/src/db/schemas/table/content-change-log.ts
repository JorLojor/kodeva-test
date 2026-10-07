import type { ContentStatus } from "@jortemplate/types";
import { relations, sql } from "drizzle-orm";
import { integer, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { identifiers, timestamps } from "@/db/utils/common-table";
import { content } from "./content";
import { user } from "./user";

export const contentChangesLog = pgTable(
	"content_changes_log",
	{
		...identifiers(),
		status: varchar("status", { length: 16 }).$type<ContentStatus>().notNull(),
		userId: integer()
			.notNull()
			.references(() => user.id),
		...timestamps(),
	},
	(table) => [
		uniqueIndex("content_log_single_pending")
			.on(table.status)
			.where(sql`${table.status} = 'pending' AND ${table.deletedAt} IS NULL`),
		uniqueIndex("content_log_single_active")
			.on(table.status)
			.where(sql`${table.status} = 'active' AND ${table.deletedAt} IS NULL`),
	],
);

export const contentChangesLogRelation = relations(
	contentChangesLog,
	({ many, one }) => ({
		contents: many(content),
		user: one(user, {
			fields: [contentChangesLog.userId],
			references: [user.id],
		}),
	}),
);

export type ContentChangesLog = typeof contentChangesLog.$inferSelect;
export type NewcontentChangesLog = typeof contentChangesLog.$inferInsert;
