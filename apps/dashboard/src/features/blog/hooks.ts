import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type BlogInput, deleteBlog, getBlog, getBlogs, saveBlog } from "./api";
export function useBlogs(page: number, status: string) {
	return useQuery({
		queryKey: ["blog", "list", page, status],
		queryFn: ({ signal }) => getBlogs(page, status, signal),
	});
}
export function useBlog(id: string) {
	return useQuery({
		queryKey: ["blog", "detail", id],
		queryFn: ({ signal }) => getBlog(id, signal),
		enabled: id !== "new",
		refetchOnWindowFocus: false,
	});
}
export function useSaveBlog() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ input, id }: { input: BlogInput; id?: string }) =>
			saveBlog(input, id),
		retry: false,
		onSuccess: async (data) => {
			client.setQueryData(["blog", "detail", data.publicId], data);
			await client.invalidateQueries({ queryKey: ["blog", "list"] });
		},
	});
}
export function useDeleteBlog() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: deleteBlog,
		retry: false,
		onSuccess: async (_, id) => {
			client.removeQueries({ queryKey: ["blog", "detail", id] });
			await client.invalidateQueries({ queryKey: ["blog", "list"] });
		},
	});
}
