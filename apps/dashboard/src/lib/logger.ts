import { createLogger } from "@jortemplate/utils/logger";

export const log = createLogger({
  name: "dashboard",
  level: import.meta.env.DEV ? "debug" : "info",
});
