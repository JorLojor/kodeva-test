import type {
	CampaignAttribution,
	OrderLine,
	OrderStatus,
	TransferAccount,
} from "@jortemplate/types";
import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { identifiers, timestamps } from "@/db/utils/common-table";
import { user } from "./user";
export const orders = pgTable(
	"orders",
	{
		...identifiers(),
		attribution: jsonb("attribution").$type<CampaignAttribution>().notNull().default({}),
		tokenHash: text("token_hash").notNull().unique(),
		requestHash: text("request_hash").notNull(),
		buyer: jsonb("buyer").$type<{ name: string; email: string; company: string }>().notNull(),
		items: jsonb("items").$type<OrderLine[]>().notNull(),
		total: integer("total").notNull(),
		bank: jsonb("bank").$type<TransferAccount>().notNull(),
		status: text("status").$type<OrderStatus>().notNull().default("awaiting_payment"),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		}).notNull(),
		proofKey: text("proof_key"),
		proofBucket: text("proof_bucket"),
		rejectionReason: text("rejection_reason"),
		reviewedBy: integer("reviewed_by").references(() => user.id),
		...timestamps(),
	},
	(t) => [
		index("orders_status_created_idx").on(t.status, t.createdAt),
		check(
			"orders_status_check",
			sql`${t.status} in ('awaiting_payment','review','paid','rejected','expired','cancelled')`,
		),
		check("orders_total_positive", sql`${t.total}>0`),
	],
);
