declare module "pino/browser.js" {
  import type { Logger, LoggerOptions } from "pino";

  export default function pino(options?: LoggerOptions): Logger;
}
