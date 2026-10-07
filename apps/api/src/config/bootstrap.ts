import app from "@/app";
import { env } from "@/config/env";
import { log as logger } from "@/utils/logger";

export async function bootstrap() {
	const server = Bun.serve({
		hostname: env.HOST,
		port: env.PORT,
		fetch: (request, server) =>
			app.fetch(request, {
				clientIp:
					(env.TRUSTED_IP_HEADER && request.headers.get(env.TRUSTED_IP_HEADER)?.trim()) ||
					(server.requestIP(request)?.address ?? null),
			}),
	});

	logger.info(
		{
			environment: env.NODE_ENV,
			url: server.url.toString(),
		},
		"API started",
	);

	let isShuttingDown = false;

	const shutdown = async (signal: string) => {
		if (isShuttingDown) return;
		isShuttingDown = true;

		logger.info({ signal }, "Shutting down API");
		await server.stop(true);
		process.exit(0);
	};

	process.once("SIGINT", () => void shutdown("SIGINT"));
	process.once("SIGTERM", () => void shutdown("SIGTERM"));

	return server;
}
