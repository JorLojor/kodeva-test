import type { Logger } from "pino";
import pino from "pino/browser.js";
import type { LoggerOptions } from "./types";

export type { LoggerOptions } from "./types";

export function createLogger({ name, level = "info" }: LoggerOptions): Logger {
  return pino({ level, browser: { asObject: true, serialize: true } }).child({
    name,
  });
}
