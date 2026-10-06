import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
import db from "@/db";
import { repositoryResult } from "@/db/repository-result";
import { publicUserFields, sessions, user } from "@/db/schemas";
import type {
	CreateUserInput,
	ListUsersInput,
	UpdateUserInput,
} from "@/services/user-management/dto";

export function listUsers(input: ListUsersInput) {
	return repositoryResult(() =>
		db.transaction(
			async (tx) => {
				const pattern = `%${input.search.replace(/[\\%_]/g, "\\$&")}%`;
				const where = and(
					isNull(user.deletedAt),
					input.search ? or(ilike(user.username, pattern), ilike(user.email, pattern)) : undefined,
				);
				const rows = await tx
					.select(publicUserFields)
					.from(user)
					.where(where)
					.orderBy(asc(user.id))
					.limit(input.limit)
					.offset((input.page - 1) * input.limit);
				const [result] = await tx.select({ total: count() }).from(user).where(where);
				return { rows, total: result?.total ?? 0 };
			},
			{ isolationLevel: "repeatable read", accessMode: "read only" },
		),
	);
}

export function findUser(publicId: string) {
	return repositoryResult(async () => {
		const [row] = await db
			.select(publicUserFields)
			.from(user)
			.where(and(eq(user.publicId, publicId), isNull(user.deletedAt)))
			.limit(1);
		return row;
	});
}

// Password values passed to write functions must already be hashed by the service.
export function createUser(input: CreateUserInput) {
	return repositoryResult(async () => {
		const [row] = await db.insert(user).values(input).returning(publicUserFields);
		return row;
	});
}

export function updateUser(publicId: string, changes: UpdateUserInput) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(5678001)`);
			const [current] = await tx
				.select()
				.from(user)
				.where(and(eq(user.publicId, publicId), isNull(user.deletedAt)))
				.for("update");
			if (!current) return { status: "not_found" } as const;
			if (current.role === "admin" && changes.role === "user") {
				const [admins] = await tx
					.select({ total: count() })
					.from(user)
					.where(and(eq(user.role, "admin"), isNull(user.deletedAt)));
				if ((admins?.total ?? 0) <= 1) return { status: "last_admin" } as const;
			}
			const [row] = await tx
				.update(user)
				.set({ ...changes, updatedAt: new Date() })
				.where(eq(user.id, current.id))
				.returning(publicUserFields);
			if (
				changes.password !== undefined ||
				(changes.role !== undefined && changes.role !== current.role)
			) {
				await tx.delete(sessions).where(eq(sessions.userId, current.id));
			}
			return { status: "updated", data: row } as const;
		}),
	);
}

export function deleteUser(publicId: string) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(sql`select pg_advisory_xact_lock(5678001)`);
			const [current] = await tx
				.select()
				.from(user)
				.where(and(eq(user.publicId, publicId), isNull(user.deletedAt)))
				.for("update");
			if (!current) return { status: "not_found" } as const;
			if (current.role === "admin") {
				const [admins] = await tx
					.select({ total: count() })
					.from(user)
					.where(and(eq(user.role, "admin"), isNull(user.deletedAt)));
				if ((admins?.total ?? 0) <= 1) return { status: "last_admin" } as const;
			}
			await tx
				.update(user)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(eq(user.id, current.id));
			await tx.delete(sessions).where(eq(sessions.userId, current.id));
			return { status: "deleted" } as const;
		}),
	);
}
