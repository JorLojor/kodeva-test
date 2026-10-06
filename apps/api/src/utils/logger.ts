import { createLogger } from "@jortemplate/utils/logger";
import { env } from "@/config/env";

export const log = createLogger({
	name: "api",
	level: env.LOG_LEVEL,
	pretty: env.NODE_ENV === "development",
});

export default { getInstance: () => log };
