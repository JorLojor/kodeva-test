import { bodyLimit } from "hono/body-limit";
import { createRouter } from "@/lib/create-app";
import { authMiddleware, requireAdmin } from "@/middleware/auth";
import { publicMiddleware } from "@/middleware/public";
import FormsService from "@/services/forms/service";

const route = createRouter().basePath("/forms");

route.get("/leadcapture", authMiddleware, requireAdmin, (c) =>
	new FormsService(c).listLeadCaptures(),
);

route.post("/leadcapture", publicMiddleware, bodyLimit({ maxSize: 16_384 }), (c) =>
	new FormsService(c).submitLeadCapture(),
);

export default route;
