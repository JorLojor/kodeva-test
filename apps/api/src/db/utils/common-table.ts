import { integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const timestamps = () => ({
	createdAt: timestamp("created_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
	deletedAt: timestamp("deleted_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	}),
	updatedAt: timestamp("updated_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
});

export const identifiers = () => ({
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	publicId: uuid("public_id").defaultRandom().notNull().unique(),
});
