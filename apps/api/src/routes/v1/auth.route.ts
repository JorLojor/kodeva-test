import { bodyLimit } from "hono/body-limit";
import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middleware/auth";
import AuthenticationService from "@/services/authentications/service";

const route = createRouter().basePath("/auth");

route.use("*", bodyLimit({ maxSize: 16_384 }));
route.use("*", async (c, next) => {
	c.header("Cache-Control", "no-store");
	await next();
});
route.post("/login", (c) => new AuthenticationService(c).login());
route.post("/refresh", (c) => new AuthenticationService(c).refresh());
route.get("/session", authMiddleware, (c) => new AuthenticationService(c).session());
route.post("/logout", (c) => new AuthenticationService(c).logout());

export default route;
