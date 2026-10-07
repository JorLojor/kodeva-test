import { useQuery } from "@tanstack/react-query";
import { getLeadCaptures } from "./api";

export function useLeadCaptures(offset: number) {
	return useQuery({
		queryKey: ["forms", "leadcapture", offset],
		queryFn: ({ signal }) => getLeadCaptures(offset, signal),
	});
}
