import { and, eq, gt, isNull, or } from "drizzle-orm";
import db from "@/db";
import { repositoryResult } from "@/db/repository-result";
import { publicUserFields, sessions, user } from "@/db/schemas";
import type { NewSession } from "@/db/schemas/table/sessions";

export function findCredentials(identifier: string) {
	return repositoryResult(async () => {
		const [row] = await db
			.select()
			.from(user)
			.where(
				and(isNull(user.deletedAt), or(eq(user.username, identifier), eq(user.email, identifier))),
			)
			.limit(1);
		return row;
	});
}

export function createSession(
	userId: number,
	passwordHash: string,
	session: Omit<NewSession, "userId">,
) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			const [row] = await tx
				.select({ ...publicUserFields, password: user.password })
				.from(user)
				.where(and(eq(user.id, userId), isNull(user.deletedAt)))
				.for("update");
			if (!row || row.password !== passwordHash) return undefined;
			await tx.insert(sessions).values({ ...session, userId });
			const { password: _password, ...safeUser } = row;
			return safeUser;
		}),
	);
}

export function findSession(accessTokenHash: string) {
	return repositoryResult(async () => {
		const [row] = await db
			.select({
				user: { id: user.id, publicId: user.publicId, role: user.role },
				sessionId: sessions.id,
			})
			.from(sessions)
			.innerJoin(user, eq(user.id, sessions.userId))
			.where(
				and(
					eq(sessions.accessToken, accessTokenHash),
					gt(sessions.expiresAt, new Date()),
					gt(sessions.refreshExpiresAt, new Date()),
					isNull(user.deletedAt),
				),
			)
			.limit(1);
		return row;
	});
}

export function getSession(id: string, userId: number) {
	return repositoryResult(async () => {
		const [row] = await db
			.select({
				user: publicUserFields,
				expiresAt: sessions.expiresAt,
				refreshExpiresAt: sessions.refreshExpiresAt,
			})
			.from(sessions)
			.innerJoin(user, eq(user.id, sessions.userId))
			.where(
				and(
					eq(sessions.id, id),
					eq(user.id, userId),
					gt(sessions.expiresAt, new Date()),
					gt(sessions.refreshExpiresAt, new Date()),
					isNull(user.deletedAt),
				),
			)
			.limit(1);
		return row;
	});
}

export function rotateSession(
	refreshTokenHash: string,
	tokens: { accessToken: string; refreshToken: string; expiresAt: Date },
) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			const [candidate] = await tx
				.select()
				.from(sessions)
				.where(
					and(
						eq(sessions.refreshToken, refreshTokenHash),
						gt(sessions.refreshExpiresAt, new Date()),
					),
				)
				.limit(1);
			if (!candidate) return undefined;

			const [activeUser] = await tx
				.select(publicUserFields)
				.from(user)
				.where(and(eq(user.id, candidate.userId), isNull(user.deletedAt)))
				.for("update");
			if (!activeUser) return undefined;

			const [rotated] = await tx
				.update(sessions)
				.set({
					...tokens,
					expiresAt: new Date(
						Math.min(tokens.expiresAt.getTime(), candidate.refreshExpiresAt.getTime()),
					),
				})
				.where(
					and(
						eq(sessions.id, candidate.id),
						eq(sessions.refreshToken, refreshTokenHash),
						gt(sessions.refreshExpiresAt, new Date()),
					),
				)
				.returning({
					expiresAt: sessions.expiresAt,
					refreshExpiresAt: sessions.refreshExpiresAt,
				});
			if (!rotated) return undefined;
			return { ...rotated, user: activeUser };
		}),
	);
}

export function deleteSessionByTokens(accessTokenHash?: string, refreshTokenHash?: string) {
	return repositoryResult(async () => {
		if (!accessTokenHash && !refreshTokenHash) return;
		await db
			.delete(sessions)
			.where(
				or(
					accessTokenHash ? eq(sessions.accessToken, accessTokenHash) : undefined,
					refreshTokenHash ? eq(sessions.refreshToken, refreshTokenHash) : undefined,
				),
			);
	});
}
