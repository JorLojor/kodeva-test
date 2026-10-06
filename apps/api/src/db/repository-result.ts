import type { RepositoryResult } from "@/types/repository";

export async function repositoryResult<T>(query: () => Promise<T>): Promise<RepositoryResult<T>> {
	try {
		return { ok: true, data: await query() };
	} catch (error) {
		return { ok: false, error };
	}
}
