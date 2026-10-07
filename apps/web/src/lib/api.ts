const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
if (!configuredUrl) throw new Error("NEXT_PUBLIC_API_URL is required");
const parsedUrl = new URL(configuredUrl);
if (
	!["http:", "https:"].includes(parsedUrl.protocol) ||
	parsedUrl.username ||
	parsedUrl.password ||
	parsedUrl.pathname !== "/" ||
	parsedUrl.search ||
	parsedUrl.hash
) {
	throw new Error(
		"NEXT_PUBLIC_API_URL must be an HTTP(S) API origin without credentials or path",
	);
}
const apiUrl = parsedUrl.origin;

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly retryAfter = 0,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function apiRequest<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const controller = new AbortController();
	const abort = () => controller.abort();
	if (options.signal?.aborted) abort();
	else options.signal?.addEventListener("abort", abort, { once: true });
	const timeout = setTimeout(
		abort,
		options.body instanceof FormData ? 60000 : 15000,
	);
	const headers = new Headers(options.headers);
	if (options.body && !(options.body instanceof FormData))
		headers.set("Content-Type", "application/json");
	try {
		const response = await fetch(`${apiUrl}/api/v1${path}`, {
			...options,
			headers,
			signal: controller.signal,
			credentials: "omit",
			cache: "no-store",
		});
		const body: unknown = await response.json().catch(() => null);
		if (!response.ok) {
			const message =
				body &&
				typeof body === "object" &&
				"message" in body &&
				typeof body.message === "string"
					? body.message
					: "Request failed";
			const seconds = Number(response.headers.get("Retry-After"));
			throw new ApiError(
				message,
				response.status,
				Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 0,
			);
		}
		if (!body || typeof body !== "object" || !("data" in body))
			throw new ApiError("Invalid API response", 502);
		return body.data as T;
	} finally {
		clearTimeout(timeout);
		options.signal?.removeEventListener("abort", abort);
	}
}
