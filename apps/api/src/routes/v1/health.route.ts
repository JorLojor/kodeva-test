import { createRouter } from "@/lib/create-app";

const healthRouter = createRouter();

healthRouter.get("/", (c) =>
	c.json({
		status: "healthy" as const,
		uptime: process.uptime(),
		serverTime: new Date().toISOString(),
	}),
);

export default healthRouter;
