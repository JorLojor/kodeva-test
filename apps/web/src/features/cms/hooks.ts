import type { PublishedCms } from "@jortemplate/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ApiError, apiRequest } from "@/lib/api";

export const publishedCmsOptions = () =>
	queryOptions({
		queryKey: ["cms", "published"] as const,
		queryFn: async ({ signal }) => {
			const data = await apiRequest<PublishedCms>("/cms/published", { signal });
			if (
				!data ||
				!Array.isArray(data.sections) ||
				(data.version !== null && data.version?.status !== "active")
			) {
				throw new ApiError("Invalid published content", 502);
			}
			return data;
		},
		staleTime: 60_000,
		retry: (attempt, error) =>
			attempt < 1 &&
			!(error instanceof ApiError && error.status >= 400 && error.status < 500),
	});

export function usePublishedCms() {
	return useQuery({ ...publishedCmsOptions(), refetchInterval: 60_000 });
}
