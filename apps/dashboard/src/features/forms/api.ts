import type { LeadCapturePageResult } from "@jortemplate/types";
import { request } from "../../lib/api";

export async function getLeadCaptures(offset: number, signal?: AbortSignal) {
	return (
		await request<{ data: LeadCapturePageResult }>(
			`/forms/leadcapture?offset=${offset}`,
			{ signal },
		)
	).data;
}
