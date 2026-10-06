import { createLogger } from "@jortemplate/utils/logger";

export const log = createLogger({
  name: "web",
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});
