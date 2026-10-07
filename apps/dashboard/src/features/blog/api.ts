import type { BlogPayload, ContentStatus, Language } from "@jortemplate/types";
import { request } from "../../lib/api";
export type BlogInput = {
	slug: string;
	coverImage: string;
	status: ContentStatus;
	contentPayload: BlogPayload;
};
export type BlogArticle = BlogInput & {
	publicId: string;
	createdAt: string;
	updatedAt: string;
};
export type BlogList = {
	items: (Omit<BlogArticle, "contentPayload"> & {
		title: Language;
		excerpt: Language;
	})[];
	page: number;
	limit: number;
	hasMore: boolean;
};
export async function getBlogs(
	page: number,
	status: string,
	signal?: AbortSignal,
) {
	return (
		await request<{ data: BlogList }>(
			`/blog?page=${page}&limit=10${status ? `&status=${status}` : ""}`,
			{ signal },
		)
	).data;
}
export async function getBlog(id: string, signal?: AbortSignal) {
	return (await request<{ data: BlogArticle }>(`/blog/${id}`, { signal })).data;
}
export async function saveBlog(input: BlogInput, id?: string) {
	return (
		await request<{ data: BlogArticle }>(id ? `/blog/${id}` : "/blog", {
			method: id ? "PATCH" : "POST",
			body: JSON.stringify(input),
		})
	).data;
}
export async function deleteBlog(id: string) {
	await request(`/blog/${id}`, { method: "DELETE" });
}
