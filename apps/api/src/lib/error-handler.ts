import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppError } from "@/lib/error";
import type { AppEnv } from "@/types/app";
import { log as logger } from "@/utils/logger";

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
	const status = error instanceof HTTPException ? error.status : 500;
	const message = error instanceof HTTPException ? error.message : "Internal server error";

	logger[status >= 500 ? "error" : "warn"](
		{
			error: {
				message: error.message,
				stack: error.stack,
			},
			method: c.req.method,
			path: c.req.path,
			requestId: c.get("requestId"),
			status,
		},
		message,
	);

	const response = c.json(
		{
			message,
			errors: [error instanceof AppError && error.errorCode ? error.errorCode : message],
		},
		status,
	);

	if (error instanceof HTTPException && error.res) {
		error.res.headers.forEach((value, name) => {
			if (name !== "content-type" && name !== "content-length") {
				response.headers.set(name, value);
			}
		});
	}

	return response;
};
