import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "@/types/app";

const MAX_REQUESTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_CLIENTS = 10_000;
const clients = new Map<string, { count: number; resetAt: number }>();

export const publicMiddleware: MiddlewareHandler<AppEnv> = async (context, next) => {
	const now = performance.now();
	for (const [key, entry] of clients) {
		if (entry.resetAt > now) break;
		clients.delete(key);
	}

	const address = context.env?.clientIp?.toLowerCase() ?? "unknown";
	const key = address.startsWith("::ffff:") ? address.slice(7) : address;
	let entry = clients.get(key);
	context.header("Cache-Control", "no-store");
	context.header("X-RateLimit-Limit", String(MAX_REQUESTS));
	if ((!entry && clients.size >= MAX_CLIENTS) || (entry && entry.count >= MAX_REQUESTS)) {
		const resetAt = entry?.resetAt ?? clients.values().next().value?.resetAt ?? now + WINDOW_MS;
		const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));
		context.header("X-RateLimit-Remaining", "0");
		context.header("Retry-After", String(retryAfter));
		return context.json(
			{
				message: `too many requests. Try again in ${retryAfter} seconds.`,
				errors: ["PUBLIC_RATE_LIMITED"],
			},
			429,
		);
	}
	if (!entry) {
		entry = { count: 0, resetAt: now + WINDOW_MS };
		clients.set(key, entry);
	}
	entry.count += 1;
	context.header("X-RateLimit-Remaining", String(MAX_REQUESTS - entry.count));
	return next();
};
