import type { LevelWithSilent } from "pino";

export type LoggerOptions = {
  name: string;
  level?: LevelWithSilent;
  /** Human-readable terminal output. Ignored in browsers. Defaults to false. */
  pretty?: boolean;
};
