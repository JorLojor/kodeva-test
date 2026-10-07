const apiUrl = (
	import.meta.env?.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function request<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const headers = new Headers(options.headers);
	if (options.body && !(options.body instanceof FormData))
		headers.set("Content-Type", "application/json");
	const response = await fetch(`${apiUrl}/api/v1${path}`, {
		...options,
		headers,
		credentials: "include",
	});
	const body: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		const message =
			body &&
			typeof body === "object" &&
			"message" in body &&
			typeof body.message === "string"
				? body.message
				: "Permintaan gagal. Coba lagi.";
		throw new ApiError(message, response.status);
	}
	if (!body || typeof body !== "object")
		throw new Error("Respons API tidak valid.");
	return body as T;
}

export async function requestBlob(
	path: string,
	signal?: AbortSignal,
): Promise<Blob> {
	const response = await fetch(`${apiUrl}/api/v1${path}`, {
		credentials: "include",
		cache: "no-store",
		...(signal ? { signal } : {}),
	});
	if (!response.ok)
		throw new ApiError("Bukti transfer belum bisa dimuat", response.status);
	return response.blob();
}
