import { bodyLimit } from "hono/body-limit";
import { createRouter } from "@/lib/create-app";
import { authMiddleware, requireAdmin } from "@/middleware/auth";
import UserManagementService from "@/services/user-management/service";

const route = createRouter().basePath("/users");

route.use("*", authMiddleware, requireAdmin);
route.use("*", bodyLimit({ maxSize: 16_384 }));
route.get("/", (c) => new UserManagementService(c).list());
route.post("/", (c) => new UserManagementService(c).create());
route.get("/:publicId", (c) => new UserManagementService(c).find());
route.patch("/:publicId", (c) => new UserManagementService(c).update());
route.delete("/:publicId", (c) => new UserManagementService(c).delete());

export default route;
