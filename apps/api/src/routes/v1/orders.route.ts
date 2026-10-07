import { bodyLimit } from "hono/body-limit";
import { createRouter } from "@/lib/create-app";
import { authMiddleware, requireAdmin } from "@/middleware/auth";
import { publicMiddleware } from "@/middleware/public";
import OrdersService from "@/services/orders/service";

const route = createRouter().basePath("/orders");
route.use("*", async (c, next) => {
	c.header("Cache-Control", "no-store");
	await next();
});
route.get("/current", (c) => new OrdersService(c).current());
route.get("/inventory", (c) => new OrdersService(c).inventory());
route.get("/admin", authMiddleware, requireAdmin, (c) => new OrdersService(c).list());
route.get("/admin/:id", authMiddleware, requireAdmin, (c) => new OrdersService(c).get(true));
route.get("/admin/:id/proof", authMiddleware, requireAdmin, (c) =>
	new OrdersService(c).proof(true),
);
route.post("/admin/:id/review", authMiddleware, requireAdmin, bodyLimit({ maxSize: 8192 }), (c) =>
	new OrdersService(c).review(),
);
route.post("/", publicMiddleware, bodyLimit({ maxSize: 16384 }), (c) =>
	new OrdersService(c).create(),
);
route.get("/:id", (c) => new OrdersService(c).get());
route.get("/:id/proof", (c) => new OrdersService(c).proof());
route.post("/:id/proof", publicMiddleware, bodyLimit({ maxSize: 5 * 1024 * 1024 + 65536 }), (c) =>
	new OrdersService(c).upload(),
);
route.post("/:id/cancel", (c) => new OrdersService(c).cancel());
export default route;
