import { bodyLimit } from "hono/body-limit";
import { createRouter } from "@/lib/create-app";
import { authMiddleware, requireAdmin } from "@/middleware/auth";
import CmsService from "@/services/cms/service";

const route = createRouter().basePath("/cms");
const limitBody = bodyLimit({ maxSize: 1_048_576 });

route.get("/published", (c) => new CmsService(c).getPublished());
route.get("/editor", authMiddleware, requireAdmin, (c) => new CmsService(c).getEditor());
route.get("/versions", authMiddleware, requireAdmin, (c) => new CmsService(c).getHistory());
route.get("/versions/:publicId", authMiddleware, requireAdmin, (c) =>
	new CmsService(c).getVersion(),
);
route.post("/activate", authMiddleware, requireAdmin, limitBody, (c) =>
	new CmsService(c).activateVersion(),
);
route.patch("/draft", authMiddleware, requireAdmin, limitBody, (c) =>
	new CmsService(c).saveDraft(),
);
route.post("/publish", authMiddleware, requireAdmin, limitBody, (c) =>
	new CmsService(c).publishDraft(),
);

export default route;
