import type { OrderView } from "@jortemplate/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../../lib/api";
export function useOrders(page: number) {
	return useQuery({
		queryKey: ["orders", page],
		queryFn: async ({ signal }) =>
			(
				await request<{ data: { items: OrderView[]; hasMore: boolean } }>(
					`/orders/admin?page=${page}`,
					{ signal },
				)
			).data,
		refetchInterval: 15000,
	});
}
export function useOrder(id: string) {
	return useQuery({
		queryKey: ["order", id],
		queryFn: async ({ signal }) =>
			(await request<{ data: OrderView }>(`/orders/admin/${id}`, { signal }))
				.data,
		refetchInterval: 15000,
	});
}
export function useReview(id: string) {
	const client = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			decision: "paid" | "rejected";
			reason: string;
			version: string;
		}) =>
			(
				await request<{ data: OrderView }>(`/orders/admin/${id}/review`, {
					method: "POST",
					body: JSON.stringify(input),
				})
			).data,
		retry: false,
		onSuccess: async (data) => {
			client.setQueryData(["order", id], data);
			await client.invalidateQueries({ queryKey: ["orders"] });
		},
	});
}
