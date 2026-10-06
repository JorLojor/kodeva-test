import { AppError } from "@/lib/error";
import type { RepositoryResult } from "@/types/repository";

export function unwrapRepositoryResult<T>(result: RepositoryResult<T>): T {
	if (result.ok) return result.data;
	throw result.error;
}

export function unwrapUserWriteResult<T>(result: RepositoryResult<T>): T {
	if (result.ok) return result.data;
	const cause =
		result.error instanceof Error && result.error.cause ? result.error.cause : result.error;
	if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
		throw AppError.conflict("Username or email already exists", "USER_EXISTS");
	}
	throw result.error;
}
