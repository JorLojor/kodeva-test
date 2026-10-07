import { AppError } from "@/lib/error";
import BaseService from "@/services/base.service";
import { unwrapRepositoryResult } from "@/services/repository-result";
import { parseBody, parseInput } from "@/services/validation";
import {
	AdminBlogListDto,
	BlogIdDto,
	BlogListDto,
	BlogSlugDto,
	CreateBlogDto,
	UpdateBlogDto,
} from "./dto";
import * as repository from "./repository";

export default class BlogService extends BaseService {
	async list(publishedOnly: boolean) {
		try {
			this.context.header("Cache-Control", "no-store");
			const input = parseInput(
				publishedOnly ? BlogListDto : AdminBlogListDto,
				this.context.req.query(),
			);
			return this.success({
				message: "Blogs retrieved",
				data: unwrapRepositoryResult(await repository.list(input, publishedOnly)),
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}
	async get(publishedOnly: boolean) {
		try {
			this.context.header("Cache-Control", "no-store");
			const value = parseInput(
				publishedOnly ? BlogSlugDto : BlogIdDto,
				this.context.req.param(publishedOnly ? "slug" : "publicId"),
			);
			const data = this.requireFound(
				unwrapRepositoryResult(await repository.get(value, publishedOnly)),
				"Blog",
			);
			return this.success({ message: "Blog retrieved", data });
		} catch (error) {
			return this.failFromError(error);
		}
	}
	async create() {
		try {
			const input = await parseBody(this.context, CreateBlogDto);
			const data = unwrapRepositoryResult(
				await repository.create(this.context.get("authUser").id, input),
			);
			if (!data) throw AppError.internalServerError("Failed to create blog");
			return this.success({ status: 201, message: "Blog created", data });
		} catch (error) {
			return this.writeError(error);
		}
	}
	async update() {
		try {
			const publicId = parseInput(BlogIdDto, this.context.req.param("publicId"));
			const input = await parseBody(this.context, UpdateBlogDto);
			const data = this.requireFound(
				unwrapRepositoryResult(await repository.update(publicId, input)),
				"Blog",
			);
			return this.success({ message: "Blog updated", data });
		} catch (error) {
			return this.writeError(error);
		}
	}
	async remove() {
		try {
			const publicId = parseInput(BlogIdDto, this.context.req.param("publicId"));
			const data = this.requireFound(
				unwrapRepositoryResult(await repository.remove(publicId)),
				"Blog",
			);
			return this.success({ message: "Blog deleted", data });
		} catch (error) {
			return this.failFromError(error);
		}
	}
	private writeError(error: unknown) {
		let cause = error;
		while (cause instanceof Error) {
			if ("code" in cause && cause.code === "23505")
				return this.failFromError(AppError.conflict("Slug already exists", "BLOG_SLUG_EXISTS"));
			cause = cause.cause;
		}
		return this.failFromError(error);
	}
}
