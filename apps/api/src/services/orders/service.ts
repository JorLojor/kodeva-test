import { z } from "zod";
import { env } from "@/config/env";
import { transferAvailable, transferSettings } from "@/config/transfer";
import { AppError } from "@/lib/error";
import { readProof, removeProof, uploadProof } from "@/lib/payment-proof";
import { hashToken } from "@/lib/session";
import BaseService from "@/services/base.service";
import { unwrapRepositoryResult as unwrap } from "@/services/repository-result";
import { parseBody, parseInput } from "@/services/validation";
import { CreateOrderDto, ListDto, ReviewDto } from "./dto";
import * as repo from "./repository";

function view(row: typeof import("@/db/schemas/table/orders").orders.$inferSelect) {
	const { tokenHash, requestHash, proofKey, proofBucket, id, deletedAt, reviewedBy, ...data } = row;
	return { ...data, hasProof: !!proofKey };
}
export default class OrdersService extends BaseService {
	private token() {
		const token = this.context.req.header("Authorization")?.replace(/^Bearer /, "");
		if (!token || !/^[a-f0-9]{64}$/.test(token))
			throw AppError.unauthorized("Akses pesanan diperlukan");
		return hashToken(token);
	}
	private id() {
		return parseInput(z.uuid(), this.context.req.param("id"));
	}
	private failure(error: unknown) {
		return this.failFromError(
			error instanceof AppError ? error : AppError.internalServerError("Permintaan pesanan gagal"),
		);
	}
	async current() {
		try {
			return this.success({ data: view(unwrap(await repo.current(this.token()))) });
		} catch (e) {
			return this.failure(e);
		}
	}
	async inventory() {
		try {
			return this.success({
				data: { available: unwrap(await repo.inventory()), enabled: transferAvailable() },
			});
		} catch (e) {
			return this.failure(e);
		}
	}
	async create() {
		try {
			const token = this.token();
			const input = await parseBody(this.context, CreateOrderDto);
			return this.success({ status: 201, data: view(unwrap(await repo.create(input, token))) });
		} catch (e) {
			return this.failure(e);
		}
	}
	async get(admin = false) {
		try {
			return this.success({
				data: view(unwrap(await repo.get(this.id(), admin ? undefined : this.token()))),
			});
		} catch (e) {
			return this.failure(e);
		}
	}
	async list() {
		try {
			const { page } = parseInput(ListDto, this.context.req.query());
			const result = unwrap(await repo.list(page));
			return this.success({ data: { ...result, items: result.items.map(view) } });
		} catch (e) {
			return this.failure(e);
		}
	}
	async cancel() {
		try {
			const row = unwrap(await repo.cancel(this.id(), this.token()));
			if (!row) throw new Error();
			return this.success({ data: view(row) });
		} catch (e) {
			return this.failure(e);
		}
	}
	async review() {
		try {
			const input = await parseBody(this.context, ReviewDto);
			const row = unwrap(
				await repo.review(
					this.id(),
					input.version,
					input.decision,
					input.reason,
					this.context.get("authUser").id,
				),
			);
			if (!row) throw new Error();
			return this.success({ data: view(row) });
		} catch (e) {
			return this.failure(e);
		}
	}
	async upload() {
		let uploaded: { bucket: string; key: string } | null = null;
		try {
			const id = this.id(),
				token = this.token();
			const row = unwrap(await repo.get(id, token));
			if (!["awaiting_payment", "rejected"].includes(row.status))
				throw AppError.conflict("Pesanan tidak menerima bukti baru");
			const form = await this.context.req.raw.formData().catch(() => {
				throw AppError.badRequest("Form upload tidak valid");
			});
			const files = form.getAll("file");
			const file = files[0];
			if (files.length !== 1 || !(file instanceof File))
				throw AppError.badRequest("Pilih satu gambar bukti transfer");
			transferSettings();
			const bucket = env.CDN_BUCKET;
			const key = await uploadProof(file, bucket);
			uploaded = { bucket, key };
			const updated = unwrap(await repo.attach(id, token, row.updatedAt, key, bucket));
			if (!updated) throw new Error();
			uploaded = null;
			return this.success({ data: view(updated) });
		} catch (e) {
			if (uploaded) await removeProof(uploaded.bucket, uploaded.key).catch(() => {});
			return this.failure(e);
		}
	}
	async proof(admin = false) {
		try {
			const row = unwrap(await repo.get(this.id(), admin ? undefined : this.token()));
			if (!row.proofKey || !row.proofBucket) throw AppError.notFound("Bukti belum tersedia");
			const file = await readProof(row.proofBucket, row.proofKey);
			return new Response(new Uint8Array(file.bytes).buffer, {
				headers: {
					"Content-Type": file.type,
					"Cache-Control": "no-store",
					"X-Content-Type-Options": "nosniff",
					"Content-Disposition": "inline",
				},
			});
		} catch (e) {
			return this.failure(e);
		}
	}
}
