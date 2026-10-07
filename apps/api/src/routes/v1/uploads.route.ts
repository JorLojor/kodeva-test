import { bodyLimit } from "hono/body-limit";
import { MAX_FILE_SIZE } from "@/lib/cdn";
import { createRouter } from "@/lib/create-app";
import { authMiddleware, requireAdmin } from "@/middleware/auth";
import UploadsService from "@/services/uploads/service";

const route = createRouter().basePath("/uploads");
route.post(
	"/image",
	authMiddleware,
	requireAdmin,
	bodyLimit({ maxSize: MAX_FILE_SIZE + 65536 }),
	(c) => new UploadsService(c).image(),
);
export default route;
