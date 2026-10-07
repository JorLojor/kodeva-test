import type {
	ActivateCmsInput,
	ActivateCmsResult,
	CmsHistoryPage,
	CmsHistorySnapshot,
	CmsSnapshot,
} from "@jortemplate/types";
import { request } from "../../lib/api";

type Response<T> = { message: string; data: T };

export async function getCmsEditor(signal?: AbortSignal) {
	return (await request<Response<CmsSnapshot>>("/cms/editor", { signal })).data;
}

export async function saveCmsDraft(input: CmsSnapshot) {
	return (
		await request<Response<CmsSnapshot>>("/cms/draft", {
			method: "PATCH",
			body: JSON.stringify(input),
		})
	).data;
}

export async function publishCmsDraft(
	version: NonNullable<CmsSnapshot["version"]>,
) {
	return (
		await request<Response<CmsSnapshot>>("/cms/publish", {
			method: "POST",
			body: JSON.stringify({ version }),
		})
	).data;
}

export async function getCmsHistory(offset: number, signal?: AbortSignal) {
	return (
		await request<Response<CmsHistoryPage>>(`/cms/versions?offset=${offset}`, {
			signal,
		})
	).data;
}

export async function getCmsVersion(publicId: string, signal?: AbortSignal) {
	return (
		await request<Response<CmsHistorySnapshot>>(`/cms/versions/${publicId}`, {
			signal,
		})
	).data;
}

export async function activateCmsVersion(input: ActivateCmsInput) {
	return (
		await request<Response<ActivateCmsResult>>("/cms/activate", {
			method: "POST",
			body: JSON.stringify(input),
		})
	).data;
}
