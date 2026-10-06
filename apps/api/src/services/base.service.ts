import { type AnyColumn, type InferSelectModel, ilike, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodError } from "zod";
import db from "@/db";
import { AppError } from "@/lib/error";
import { errorHandler } from "@/lib/error-handler";
import type { AppEnv } from "@/types/app";
import type { ErrorResponse, Pagination, SuccessResponse } from "@/types/response";
import { log } from "@/utils/logger";

export default abstract class BaseService {
	protected readonly db: typeof db;
	protected readonly context: Context<AppEnv>;

	constructor(context: Context<AppEnv>) {
		this.context = context;
		this.db = db;
	}

	protected requireFound<T>(row: T | undefined | null, entityLabel: string): T {
		if (row === undefined || row === null) {
			throw AppError.notFound(`${entityLabel} not found`);
		}
		return row;
	}

	protected async requireUuid<TTable extends PgTable>(
		table: TTable,
		where: SQL,
		entityLabel: string,
	): Promise<InferSelectModel<TTable>> {
		const [row] = await this.db
			.select()
			.from(table as PgTable)
			.where(where)
			.limit(1);
		return this.requireFound(row, entityLabel) as InferSelectModel<TTable>;
	}

	protected logStep(label: string, meta?: Record<string, unknown>): () => void {
		const startedAt = performance.now();
		const details = { ...meta, requestId: this.context.get("requestId") };
		log.info(details, `[${label}] started`);
		return () => {
			log.info({ ...details, durationMs: performance.now() - startedAt }, `[${label}] completed`);
		};
	}

	protected failFromError(error: unknown): Response | Promise<Response> {
		const exception =
			error instanceof Error ? error : new Error("Unknown service error", { cause: error });
		return errorHandler(exception, this.context);
	}

	protected _generatePagination(page: number, limit: number) {
		const currentPage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
		const pageLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.trunc(limit))) : 10;
		const offset = (currentPage - 1) * pageLimit;
		if (!Number.isSafeInteger(offset)) {
			throw AppError.badRequest("Pagination offset is too large");
		}
		const countPages = (total: number) => {
			if (!Number.isSafeInteger(total) || total < 0) {
				throw AppError.badRequest("Pagination total must be a non-negative safe integer");
			}
			return Math.max(1, Math.ceil(total / pageLimit));
		};
		return { currentPage, pageLimit, offset, countPages };
	}

	protected _buildSearchConditions(search: string, columns: readonly AnyColumn[]): SQL[] {
		const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
		return columns.map((column) => ilike(column, pattern));
	}

	protected success<T>({
		data,
		pagination,
		status = 200,
		message = "sukses",
		description,
	}: {
		data?: T;
		pagination?: Pagination;
		status?: ContentfulStatusCode;
		message?: string;
		description?: string;
	} = {}): Response {
		const response: SuccessResponse<T> = { message };
		if (data !== undefined) response.data = data;
		if (pagination !== undefined) response.pagination = pagination;
		if (description !== undefined) response.description = description;
		return this.context.json(response, status);
	}

	protected error({
		errors,
		status = 400,
		message = "Bad Request",
	}: {
		errors: string[];
		status?: ContentfulStatusCode;
		message?: string;
	}): Response {
		const response: ErrorResponse = { message, errors };
		return this.context.json(response, status);
	}

	protected validationError(error: ZodError): Response {
		return this.error({
			errors: error.issues.map((issue) => {
				const field = issue.path.map(String).join(".");
				return field ? `${field}: ${issue.message}` : issue.message;
			}),
		});
	}
}
