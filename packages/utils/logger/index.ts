import pino from "pino";
import type { LoggerOptions } from "./types";

export type { LoggerOptions } from "./types";

export function createLogger({
  name,
  level = "info",
  pretty = false,
}: LoggerOptions): pino.Logger {
  return pino({
    name,
    level,
    ...(pretty && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    }),
  });
}
