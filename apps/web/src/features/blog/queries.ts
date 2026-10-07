import type { BlogPayload, ContentStatus, Language } from "@jortemplate/types";
import { queryOptions } from "@tanstack/react-query";
import { ApiError, apiRequest } from "@/lib/api";

export type BlogArticle = {
	publicId: string;
	slug: string;
	coverImage: string;
	status: ContentStatus;
	contentPayload: BlogPayload;
	createdAt: string;
	updatedAt: string;
};
type BlogSummary = Omit<BlogArticle, "contentPayload"> & {
	title: Language;
	excerpt: Language;
};
type BlogList = {
	items: BlogSummary[];
	page: number;
	limit: number;
	hasMore: boolean;
};
const retry = (attempt: number, error: Error) =>
	attempt < 1 &&
	!(error instanceof ApiError && error.status >= 400 && error.status < 500);
export const blogListOptions = (page: number) =>
	queryOptions({
		queryKey: ["blog", "published", "list", page],
		queryFn: ({ signal }) =>
			apiRequest<BlogList>(`/blog/published?page=${page}&limit=6`, { signal }),
		staleTime: 60_000,
		retry,
	});
export const blogArticleOptions = (slug: string) =>
	queryOptions({
		queryKey: ["blog", "published", "detail", slug],
		queryFn: ({ signal }) =>
			apiRequest<BlogArticle>(`/blog/published/${encodeURIComponent(slug)}`, {
				signal,
			}),
		staleTime: 60_000,
		retry,
	});
