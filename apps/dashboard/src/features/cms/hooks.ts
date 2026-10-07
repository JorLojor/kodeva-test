import type { CmsSnapshot } from "@jortemplate/types";
import {
	type QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	activateCmsVersion,
	getCmsEditor,
	getCmsHistory,
	getCmsVersion,
	publishCmsDraft,
	saveCmsDraft,
} from "./api";

export const cmsEditorKey = ["cms", "editor"] as const;
const historyKey = ["cms", "versions"] as const;
const versionKey = ["cms", "version"] as const;

async function syncEditor(client: QueryClient, editor: CmsSnapshot) {
	client.setQueryData(cmsEditorKey, editor);
	await Promise.all([
		client.invalidateQueries({ queryKey: historyKey }),
		client.invalidateQueries({ queryKey: versionKey }),
	]);
}

export function useCmsEditor() {
	return useQuery({
		queryKey: cmsEditorKey,
		queryFn: ({ signal }) => getCmsEditor(signal),
		refetchOnWindowFocus: false,
	});
}

export function useSaveCmsDraft() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: saveCmsDraft,
		retry: false,
		onSuccess: (data) => syncEditor(client, data),
	});
}

export function usePublishCmsDraft() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: publishCmsDraft,
		retry: false,
		onSuccess: (data) => syncEditor(client, data),
	});
}

export function useCmsHistory(offset: number) {
	return useQuery({
		queryKey: [...historyKey, offset],
		queryFn: ({ signal }) => getCmsHistory(offset, signal),
		refetchOnWindowFocus: false,
	});
}

export function useCmsVersion(publicId: string | null) {
	return useQuery({
		queryKey: [...versionKey, publicId],
		queryFn: ({ signal }) => getCmsVersion(publicId!, signal),
		enabled: publicId !== null,
		refetchOnWindowFocus: false,
	});
}

export function useActivateCmsVersion() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: activateCmsVersion,
		retry: false,
		onSuccess: (data) => syncEditor(client, data.editor),
	});
}
