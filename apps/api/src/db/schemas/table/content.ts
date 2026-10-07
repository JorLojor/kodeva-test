import type { ContentPayload, SectionType } from "@jortemplate/types";
import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { identifiers, timestamps } from "@/db/utils/common-table";
import { contentChangesLog } from "./content-change-log";

export type {
	ContentPayload,
	CTA,
	FaqPayload,
	HeroPayload,
	Language,
	LeadCapturePayload,
	SectionType,
	TestimonialPayload,
} from "@jortemplate/types";
export { SECTION_TYPE } from "@jortemplate/types";

export const content = pgTable(
	"content",
	{
		...identifiers(),
		section: varchar("section", { length: 32 }).$type<SectionType>().notNull(),
		order: integer("order").notNull(),
		contentChangesLogId: integer()
			.notNull()
			.references(() => contentChangesLog.id, { onDelete: "cascade" }),
		payload: jsonb("payload").$type<ContentPayload>().notNull(),
		...timestamps(),
	},
	(table) => [
		uniqueIndex("content_log_section_unique").on(table.contentChangesLogId, table.section),
	],
);

export const contentRelations = relations(content, ({ one }) => ({
	contentChangesLog: one(contentChangesLog, {
		fields: [content.contentChangesLogId],
		references: [contentChangesLog.id],
	}),
}));

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
