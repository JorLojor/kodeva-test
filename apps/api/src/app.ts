import { errorHandler } from "@/lib/error-handler";

export { errorHandler } from "@/lib/error-handler";

import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { allowedOrigins } from "@/config/env";
import { createApp } from "@/lib/create-app";
import { httpLogger } from "@/lib/http-logger";
import { csrfMiddleware } from "@/middleware/csrf";
import { v1Router } from "@/routes/v1";

const app = createApp();

app.use("*", requestId());
app.use("*", secureHeaders());
app.use("*", httpLogger);
app.use(
	"*",
	cors({
		origin: allowedOrigins,
		allowHeaders: ["Content-Type"],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		exposeHeaders: ["Content-Length", "X-Request-Id"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("/api/v1/*", csrfMiddleware);

app.get("/", (c) =>
	c.json({
		message: "jorTemplate API",
		endpoints: {
			health: "/api/v1/health",
		},
	}),
);

app.route("/api/v1", v1Router);

app.notFound((c) =>
	c.json(
		{
			message: "Route not found",
			errors: [`No route for ${c.req.method} ${c.req.path}`],
		},
		404,
	),
);

app.onError(errorHandler);

export default app;
