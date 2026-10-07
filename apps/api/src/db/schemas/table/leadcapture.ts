import type { CampaignAttribution } from "@jortemplate/types";
import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { identifiers, timestamps } from "@/db/utils/common-table";

export const leadcapture = pgTable("lead_capture", {
	...identifiers(),
	attribution: jsonb("attribution").$type<CampaignAttribution>().notNull().default({}),
	nama: text("nama").notNull(),
	email: text("email").notNull(),
	nomorWa: text("nomor_wa").notNull(),
	...timestamps(),
});

export type Leadcapture = typeof leadcapture.$inferSelect;
export type NewLeadcapture = typeof leadcapture.$inferInsert;
