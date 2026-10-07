import { CONTENT_STATUS } from "@jortemplate/types";
import { z } from "zod";

const language = (max: number) =>
	z.strictObject({
		idn: z.string().trim().min(1).max(max),
		eng: z.string().trim().min(1).max(max),
	});
const httpUrl = z
	.string()
	.trim()
	.max(2048)
	.refine((value) => {
		const url = URL.parse(value);
		return (
			url !== null && ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
		);
	}, "Must be an HTTP(S) URL without credentials");
const ctaUrl = z.union([
	httpUrl,
	z
		.string()
		.max(2048)
		.regex(/^\/(?![\\/])[^\\]*$/),
]);
export const BlogSlugDto = z
	.string()
	.min(1)
	.max(255)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
const fields = {
	slug: BlogSlugDto,
	coverImage: httpUrl,
	status: z.enum(CONTENT_STATUS),
	contentPayload: z.strictObject({
		title: language(300),
		excerpt: language(1000),
		content: z
			.array(
				z.strictObject({
					text: language(50000),
					image: z.union([httpUrl, z.literal("")]),
					cta: z.strictObject({ label: language(150), url: ctaUrl }).nullable(),
				}),
			)
			.min(1)
			.max(100),
	}),
};
export const CreateBlogDto = z.strictObject({
	...fields,
	status: fields.status.default("pending"),
});
export const UpdateBlogDto = z
	.strictObject(fields)
	.partial()
	.refine((value) => Object.keys(value).length > 0, "Provide at least one field");
export const BlogListDto = z.strictObject({
	page: z.coerce.number().int().min(1).max(10000).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const AdminBlogListDto = BlogListDto.extend({ status: fields.status.optional() });
export const BlogIdDto = z.uuid();
export type CreateBlogInput = z.infer<typeof CreateBlogDto>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogDto>;
export type BlogListInput = z.infer<typeof AdminBlogListDto>;
