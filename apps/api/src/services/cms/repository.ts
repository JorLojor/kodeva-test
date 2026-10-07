import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import db from "@/db";
import { repositoryResult } from "@/db/repository-result";
import { content, contentChangesLog, user } from "@/db/schemas";
import type { ContentPayload, SectionType } from "@/db/schemas/table/content";
import type { ContentChangesLog } from "@/db/schemas/table/content-change-log";
import type { ActivateVersionInput, PublishDraftInput, SaveDraftInput } from "./dto";
import { CmsSectionsDto } from "./dto";

// Serializes CMS operations even before the first draft/version exists.
const cmsLock = sql`SELECT pg_advisory_xact_lock(4410707)`;
type Reader = Pick<typeof db, "select">;

async function currentVersion(query: Reader) {
	const [version] = await query
		.select()
		.from(contentChangesLog)
		.where(
			and(
				isNull(contentChangesLog.deletedAt),
				inArray(contentChangesLog.status, ["pending", "active"]),
			),
		)
		.orderBy(sql`CASE WHEN ${contentChangesLog.status} = 'pending' THEN 0 ELSE 1 END`)
		.limit(1);
	return version;
}

async function snapshot(query: Reader, version: ContentChangesLog | undefined) {
	if (!version) return { version: null, sections: [] };
	const sections = await query
		.select({ section: content.section, order: content.order, payload: content.payload })
		.from(content)
		.where(and(eq(content.contentChangesLogId, version.id), isNull(content.deletedAt)))
		.orderBy(asc(content.order), asc(content.section));
	return {
		version: { publicId: version.publicId, status: version.status, updatedAt: version.updatedAt },
		sections,
	};
}

function matchesVersion(
	expected: { publicId: string; status: string; updatedAt: string } | null,
	actual: ContentChangesLog | undefined,
): boolean {
	if (!actual) return expected === null;
	return (
		expected !== null &&
		expected.publicId === actual.publicId &&
		expected.status === actual.status &&
		new Date(expected.updatedAt).getTime() === actual.updatedAt.getTime()
	);
}

function nextUpdatedAt(previous: Date): Date {
	return new Date(Math.max(Date.now(), previous.getTime() + 1));
}

export function getEditor() {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(cmsLock);
			return snapshot(tx, await currentVersion(tx));
		}),
	);
}

export function getPublished() {
	return repositoryResult(async () => {
		const [version] = await db
			.select()
			.from(contentChangesLog)
			.where(and(eq(contentChangesLog.status, "active"), isNull(contentChangesLog.deletedAt)))
			.limit(1);
		return snapshot(db, version);
	});
}

async function activeVersion(query: Reader) {
	const [version] = await query
		.select()
		.from(contentChangesLog)
		.where(and(eq(contentChangesLog.status, "active"), isNull(contentChangesLog.deletedAt)))
		.limit(1);
	return version;
}

export function getHistory(offset: number) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(cmsLock);
			const items = await tx
				.select({
					publicId: contentChangesLog.publicId,
					status: contentChangesLog.status,
					createdAt: contentChangesLog.createdAt,
					updatedAt: contentChangesLog.updatedAt,
					admin: { username: user.username },
				})
				.from(contentChangesLog)
				.innerJoin(user, eq(user.id, contentChangesLog.userId))
				.where(isNull(contentChangesLog.deletedAt))
				.orderBy(desc(contentChangesLog.createdAt), desc(contentChangesLog.id))
				.limit(21)
				.offset(offset);
			const active = await activeVersion(tx);
			return {
				items: items.slice(0, 20),
				hasMore: items.length > 20,
				activeVersion: active
					? { publicId: active.publicId, status: active.status, updatedAt: active.updatedAt }
					: null,
			};
		}),
	);
}

export function getVersion(publicId: string) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(cmsLock);
			const [version] = await tx
				.select()
				.from(contentChangesLog)
				.where(and(eq(contentChangesLog.publicId, publicId), isNull(contentChangesLog.deletedAt)))
				.limit(1);
			return version ? snapshot(tx, version) : null;
		}),
	);
}

export function activateVersion(userId: number, input: ActivateVersionInput) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(cmsLock);
			const [admin] = await tx
				.select({ id: user.id })
				.from(user)
				.where(and(eq(user.id, userId), eq(user.role, "admin"), isNull(user.deletedAt)))
				.for("update")
				.limit(1);
			if (!admin) return { status: "forbidden" as const };
			const [target] = await tx
				.select()
				.from(contentChangesLog)
				.where(
					and(
						eq(contentChangesLog.publicId, input.version.publicId),
						isNull(contentChangesLog.deletedAt),
					),
				)
				.limit(1);
			if (!target) return { status: "not_found" as const };
			const active = await activeVersion(tx);
			if (!matchesVersion(input.version, target) || !matchesVersion(input.activeVersion, active))
				return { status: "conflict" as const };
			const selected = await snapshot(tx, target);
			if (!CmsSectionsDto.safeParse(selected.sections).success)
				return { status: "invalid_content" as const };
			if (active)
				await tx
					.update(contentChangesLog)
					.set({
						status: "inactive",
						updatedAt: nextUpdatedAt(active.updatedAt),
					})
					.where(eq(contentChangesLog.id, active.id));
			const [activated] = await tx
				.update(contentChangesLog)
				.set({
					status: "active",
					userId,
					updatedAt: nextUpdatedAt(target.updatedAt),
				})
				.where(eq(contentChangesLog.id, target.id))
				.returning();
			if (!activated) throw new Error("Activation update returned no row");
			// Preserve the draft, but invalidate tokens from editors opened before activation.
			const editor = await currentVersion(tx);
			if (editor?.status === "pending")
				await tx
					.update(contentChangesLog)
					.set({
						updatedAt: nextUpdatedAt(editor.updatedAt),
					})
					.where(eq(contentChangesLog.id, editor.id));
			return {
				status: "activated" as const,
				data: {
					published: await snapshot(tx, activated),
					editor: await snapshot(tx, await currentVersion(tx)),
				},
			};
		}),
	);
}

export function saveDraft(userId: number, input: SaveDraftInput) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(cmsLock);
			const [admin] = await tx
				.select({ id: user.id })
				.from(user)
				.where(and(eq(user.id, userId), eq(user.role, "admin"), isNull(user.deletedAt)))
				.for("update")
				.limit(1);
			if (!admin) return { status: "forbidden" as const };
			const source = await currentVersion(tx);
			if (!matchesVersion(input.version, source)) return { status: "conflict" as const };
			const current = await snapshot(tx, source);
			const merged = new Map<
				SectionType,
				{ section: SectionType; order: number; payload: ContentPayload }
			>();
			for (const section of current.sections) merged.set(section.section, section);
			for (const section of input.sections) merged.set(section.section, section);
			if (new Set([...merged.values()].map((section) => section.order)).size !== merged.size) {
				return { status: "invalid_order" as const };
			}

			let draft = source;
			if (draft?.status !== "pending") {
				[draft] = await tx
					.insert(contentChangesLog)
					.values({ status: "pending", userId })
					.returning();
				if (!draft) throw new Error("Draft insert returned no row");
				const draftId = draft.id;
				// Copy the whole active page, including sections absent from the incoming patch.
				if (current.sections.length) {
					await tx
						.insert(content)
						.values(
							current.sections.map((section) => ({ ...section, contentChangesLogId: draftId })),
						);
				}
			}
			for (const section of input.sections) {
				await tx
					.insert(content)
					.values({ ...section, contentChangesLogId: draft.id })
					.onConflictDoUpdate({
						target: [content.contentChangesLogId, content.section],
						set: { order: section.order, payload: section.payload, deletedAt: null },
					});
			}
			const [updated] = await tx
				.update(contentChangesLog)
				.set({ userId, updatedAt: nextUpdatedAt(draft.updatedAt) })
				.where(eq(contentChangesLog.id, draft.id))
				.returning();
			if (!updated) throw new Error("Draft update returned no row");
			return { status: "saved" as const, data: await snapshot(tx, updated) };
		}),
	);
}

export function publishDraft(userId: number, input: PublishDraftInput) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await tx.execute(cmsLock);
			const [admin] = await tx
				.select({ id: user.id })
				.from(user)
				.where(and(eq(user.id, userId), eq(user.role, "admin"), isNull(user.deletedAt)))
				.for("update")
				.limit(1);
			if (!admin) return { status: "forbidden" as const };
			const draft = await currentVersion(tx);
			if (draft?.status !== "pending") return { status: "not_found" as const };
			if (!matchesVersion(input.version, draft)) return { status: "conflict" as const };
			await tx
				.update(contentChangesLog)
				.set({ status: "inactive" })
				.where(and(eq(contentChangesLog.status, "active"), isNull(contentChangesLog.deletedAt)));
			const [published] = await tx
				.update(contentChangesLog)
				.set({ status: "active", userId, updatedAt: nextUpdatedAt(draft.updatedAt) })
				.where(eq(contentChangesLog.id, draft.id))
				.returning();
			if (!published) throw new Error("Publish update returned no row");
			return { status: "published" as const, data: await snapshot(tx, published) };
		}),
	);
}
