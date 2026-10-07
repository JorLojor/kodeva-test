import type { OrderLine } from "@jortemplate/types";
import { products } from "@jortemplate/utils/marketplace";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { transferSettings } from "@/config/transfer";
import db from "@/db";
import { repositoryResult } from "@/db/repository-result";
import { orders } from "@/db/schemas/table/orders";
import { AppError } from "@/lib/error";
import { hashToken } from "@/lib/session";
import type { CreateOrderInput } from "./dto";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
async function lock(tx: Tx) {
	await tx.execute(sql`select pg_advisory_xact_lock(4410708)`);
	await tx
		.update(orders)
		.set({ status: "expired" })
		.where(
			and(
				inArray(orders.status, ["awaiting_payment", "rejected"]),
				lte(orders.expiresAt, new Date()),
			),
		);
}
async function used(tx: Tx) {
	const rows = await tx
		.select({ items: orders.items })
		.from(orders)
		.where(inArray(orders.status, ["awaiting_payment", "rejected", "review", "paid"]));
	const usage: Record<string, number> = {};
	for (const row of rows)
		for (const item of row.items)
			usage[item.productId] = (usage[item.productId] ?? 0) + item.quantity;
	return usage;
}
export function inventory() {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const usage = await used(tx);
			return Object.fromEntries(
				products.map((p) => [p.id, Math.max(0, p.quota - (usage[p.id] ?? 0))]),
			);
		}),
	);
}
export function create(input: CreateOrderInput, tokenHash: string) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const requestHash = hashToken(JSON.stringify(input));
			const [existing] = await tx.select().from(orders).where(eq(orders.tokenHash, tokenHash));
			if (existing) {
				if (existing.requestHash !== requestHash)
					throw AppError.conflict("Permintaan checkout berbeda. Gunakan checkout baru.");
				return existing;
			}
			const config = transferSettings();
			const items: OrderLine[] = [];
			for (const line of input.items) {
				const p = products.find((p) => p.id === line.productId);
				const pack = p?.packages.find((p) => p.id === line.packageId);
				if (!p || !pack) throw AppError.badRequest("Produk atau paket tidak tersedia");
				if (items.some((i) => i.productId === line.productId && i.packageId === line.packageId))
					throw AppError.badRequest("Paket duplikat");
				items.push({
					...line,
					name: p.name,
					packageName: pack.name,
					unit: p.unit,
					unitPrice: pack.promoPrice,
				});
			}
			const usage = await used(tx);
			for (const p of products) {
				const count = items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.quantity, 0);
				if (count > p.quota - (usage[p.id] ?? 0))
					throw AppError.conflict(`Kuota promo ${p.name} tidak mencukupi. Periksa keranjang.`);
			}
			const [row] = await tx
				.insert(orders)
				.values({
					tokenHash,
					requestHash,
					buyer: input.buyer,
					attribution: input.attribution,
					items,
					total: items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
					bank: { bank: config.bank, number: config.number, name: config.name },
					expiresAt: new Date(Date.now() + 86400000),
				})
				.returning();
			if (!row) throw new Error("Order insert failed");
			return row;
		}),
	);
}
export function get(id: string, tokenHash?: string) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const [row] = await tx
				.select()
				.from(orders)
				.where(
					and(eq(orders.publicId, id), tokenHash ? eq(orders.tokenHash, tokenHash) : undefined),
				);
			if (!row) throw AppError.notFound("Pesanan tidak ditemukan");
			return row;
		}),
	);
}
export function list(page: number) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const rows = await tx
				.select()
				.from(orders)
				.orderBy(desc(orders.createdAt), desc(orders.id))
				.limit(21)
				.offset((page - 1) * 20);
			return { items: rows.slice(0, 20), hasMore: rows.length > 20 };
		}),
	);
}
export function attach(id: string, tokenHash: string, version: Date, key: string, bucket: string) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const [row] = await tx
				.select()
				.from(orders)
				.where(and(eq(orders.publicId, id), eq(orders.tokenHash, tokenHash)));
			if (!row) throw AppError.notFound("Pesanan tidak ditemukan");
			if (
				!["awaiting_payment", "rejected"].includes(row.status) ||
				row.updatedAt.getTime() !== version.getTime()
			)
				throw AppError.conflict("Status pesanan berubah. Muat ulang pesanan.");
			const [updated] = await tx
				.update(orders)
				.set({
					status: "review",
					proofKey: key,
					proofBucket: bucket,
					rejectionReason: null,
					reviewedBy: null,
					updatedAt: new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1)),
				})
				.where(eq(orders.id, row.id))
				.returning();
			return updated;
		}),
	);
}
export function review(
	id: string,
	version: string,
	decision: "paid" | "rejected",
	reason: string,
	adminId: number,
) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const [row] = await tx.select().from(orders).where(eq(orders.publicId, id));
			if (!row) throw AppError.notFound("Pesanan tidak ditemukan");
			if (row.status !== "review" || row.updatedAt.toISOString() !== version)
				throw AppError.conflict("Pesanan sudah berubah. Muat ulang sebelum memverifikasi.");
			const [updated] = await tx
				.update(orders)
				.set({
					status: decision,
					rejectionReason: decision === "rejected" ? reason : null,
					reviewedBy: adminId,
					expiresAt: decision === "rejected" ? new Date(Date.now() + 86400000) : row.expiresAt,
					updatedAt: new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1)),
				})
				.where(eq(orders.id, row.id))
				.returning();
			return updated;
		}),
	);
}
export function cancel(id: string, tokenHash: string) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const [row] = await tx
				.select()
				.from(orders)
				.where(and(eq(orders.publicId, id), eq(orders.tokenHash, tokenHash)));
			if (!row) throw AppError.notFound("Pesanan tidak ditemukan");
			if (!["awaiting_payment", "rejected"].includes(row.status))
				throw AppError.conflict("Pesanan ini tidak bisa dibatalkan");
			const [updated] = await tx
				.update(orders)
				.set({ status: "cancelled" })
				.where(eq(orders.id, row.id))
				.returning();
			return updated;
		}),
	);
}

export function current(tokenHash: string) {
	return repositoryResult(() =>
		db.transaction(async (tx) => {
			await lock(tx);
			const [row] = await tx.select().from(orders).where(eq(orders.tokenHash, tokenHash));
			if (!row) throw AppError.notFound("Pesanan tidak ditemukan");
			return row;
		}),
	);
}
