import type { MiddlewareHandler } from "hono";
import { allowedOrigins } from "@/config/env";
import { AppError } from "@/lib/error";
import { errorHandler } from "@/lib/error-handler";
import type { AppEnv } from "@/types/app";

export const csrfMiddleware: MiddlewareHandler<AppEnv> = async (context, next) => {
	if (!["GET", "HEAD", "OPTIONS"].includes(context.req.method)) {
		const origin = context.req.header("Origin");
		if (!origin || !allowedOrigins.includes(origin)) {
			return errorHandler(
				AppError.forbidden("Request origin is not allowed", "CSRF_ORIGIN_DENIED"),
				context,
			);
		}
	}
	return next();
};
