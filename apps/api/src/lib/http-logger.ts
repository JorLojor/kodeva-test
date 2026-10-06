import type { Context, Next } from "hono";

import type { AppEnv } from "@/types/app";
import { log as logger } from "@/utils/logger";

export async function httpLogger(c: Context<AppEnv>, next: Next) {
	const startedAt = performance.now();

	await next();

	const data = {
		method: c.req.method,
		path: new URL(c.req.url),
		requestId: c.get("requestId"),
		status: c.res.status,
		durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
	};

	if (c.res.status >= 500) {
		logger.error(data, "Request completed");
	} else if (c.res.status >= 400) {
		logger.warn(data, "Request completed");
	} else {
		logger.info(data, "Request completed");
	}
}
