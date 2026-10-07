import { bodyLimit } from "hono/body-limit";
import { createRouter } from "@/lib/create-app";
import { authMiddleware, requireAdmin } from "@/middleware/auth";
import BlogService from "@/services/blog/service";

const route = createRouter().basePath("/blog");
const limitBody = bodyLimit({ maxSize: 1_048_576 });
route.get("/published", (c) => new BlogService(c).list(true));
route.get("/published/:slug", (c) => new BlogService(c).get(true));
route.get("/", authMiddleware, requireAdmin, (c) => new BlogService(c).list(false));
route.get("/:publicId", authMiddleware, requireAdmin, (c) => new BlogService(c).get(false));
route.post("/", authMiddleware, requireAdmin, limitBody, (c) => new BlogService(c).create());
route.patch("/:publicId", authMiddleware, requireAdmin, limitBody, (c) =>
	new BlogService(c).update(),
);
route.delete("/:publicId", authMiddleware, requireAdmin, (c) => new BlogService(c).remove());
export default route;
