import type { BlogPayload, ContentStatus } from "@jortemplate/types";
import { relations, sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, varchar } from "drizzle-orm/pg-core";
import { identifiers, timestamps } from "@/db/utils/common-table";
import { user } from "./user";

export type { BlogPayload } from "@jortemplate/types";

export const blog = pgTable(
	"blog",
	{
		...identifiers(),
		userId: integer()
			.notNull()
			.references(() => user.id),
		contentPayload: jsonb("content_payload").$type<BlogPayload>().notNull(),
		coverImage: varchar("cover_image").notNull(),
		slug: varchar("slug", { length: 255 }).notNull().unique(),
		status: varchar("status", { length: 16 }).$type<ContentStatus>().notNull(),
		...timestamps(),
	},
	(table) => [
		check("blog_status_check", sql`${table.status} in ('pending', 'active', 'inactive')`),
		index("blog_public_list_idx")
			.on(table.status, table.createdAt, table.id)
			.where(sql`${table.deletedAt} is null`),
	],
);

export const blogRelations = relations(blog, ({ one }) => ({
	user: one(user, {
		fields: [blog.userId],
		references: [user.id],
	}),
}));

export type Blog = typeof blog.$inferSelect;
export type NewBlog = typeof blog.$inferInsert;
