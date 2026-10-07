import type { Language } from "@jortemplate/types";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import db from "@/db";
import { repositoryResult } from "@/db/repository-result";
import { blog } from "@/db/schemas/table/blog";
import type { BlogListInput, CreateBlogInput, UpdateBlogInput } from "./dto";

const fields = {
	publicId: blog.publicId,
	slug: blog.slug,
	coverImage: blog.coverImage,
	status: blog.status,
	contentPayload: blog.contentPayload,
	createdAt: blog.createdAt,
	updatedAt: blog.updatedAt,
};
export function list(input: BlogListInput, publishedOnly: boolean) {
	return repositoryResult(async () => {
		const status = publishedOnly ? "active" : input.status;
		const items = await db
			.select({
				publicId: blog.publicId,
				slug: blog.slug,
				coverImage: blog.coverImage,
				status: blog.status,
				title: sql<Language>`${blog.contentPayload}->'title'`,
				excerpt: sql<Language>`${blog.contentPayload}->'excerpt'`,
				createdAt: blog.createdAt,
				updatedAt: blog.updatedAt,
			})
			.from(blog)
			.where(and(isNull(blog.deletedAt), status ? eq(blog.status, status) : undefined))
			.orderBy(desc(blog.createdAt), desc(blog.id))
			.limit(input.limit + 1)
			.offset((input.page - 1) * input.limit);
		return {
			items: items.slice(0, input.limit),
			page: input.page,
			limit: input.limit,
			hasMore: items.length > input.limit,
		};
	});
}
export function get(value: string, publishedOnly: boolean) {
	return repositoryResult(async () => {
		const [row] = await db
			.select(fields)
			.from(blog)
			.where(
				and(
					isNull(blog.deletedAt),
					publishedOnly ? eq(blog.slug, value) : eq(blog.publicId, value),
					publishedOnly ? eq(blog.status, "active") : undefined,
				),
			)
			.limit(1);
		return row;
	});
}
export function create(userId: number, input: CreateBlogInput) {
	return repositoryResult(async () => {
		const [row] = await db
			.insert(blog)
			.values({ ...input, userId })
			.returning(fields);
		return row;
	});
}
export function update(publicId: string, input: UpdateBlogInput) {
	return repositoryResult(async () => {
		const [row] = await db
			.update(blog)
			.set(input)
			.where(and(eq(blog.publicId, publicId), isNull(blog.deletedAt)))
			.returning(fields);
		return row;
	});
}
export function remove(publicId: string) {
	return repositoryResult(async () => {
		const [row] = await db
			.update(blog)
			.set({ deletedAt: new Date(), status: "inactive" })
			.where(and(eq(blog.publicId, publicId), isNull(blog.deletedAt)))
			.returning({ publicId: blog.publicId });
		return row;
	});
}
