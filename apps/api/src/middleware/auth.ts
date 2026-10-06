import type { MiddlewareHandler } from "hono";
import { readAuthCookie } from "@/lib/auth-cookies";
import { AppError } from "@/lib/error";
import { errorHandler } from "@/lib/error-handler";
import { hashToken } from "@/lib/session";
import { findSession } from "@/services/authentications/repository";
import type { AppEnv } from "@/types/app";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (context, next) => {
	try {
		context.header("Cache-Control", "no-store");
		const token = readAuthCookie(context, "accessToken");
		if (!token) return errorHandler(AppError.unauthorized("Authentication required"), context);

		const result = await findSession(hashToken(token));
		if (!result.ok) {
			const error =
				result.error instanceof Error
					? result.error
					: new Error("Session lookup failed", { cause: result.error });
			return errorHandler(error, context);
		}
		if (!result.data)
			return errorHandler(AppError.unauthorized("Session expired or invalid"), context);

		context.set("authUser", result.data.user);
		context.set("sessionId", result.data.sessionId);
	} catch (error) {
		return errorHandler(
			error instanceof Error ? error : new Error("Authentication failed", { cause: error }),
			context,
		);
	}
	return next();
};

export const requireAdmin: MiddlewareHandler<AppEnv> = async (context, next) => {
	const user = context.get("authUser");
	if (!user) return errorHandler(AppError.unauthorized("Authentication required"), context);
	if (user.role !== "admin")
		return errorHandler(AppError.forbidden("Admin access required"), context);
	return next();
};
