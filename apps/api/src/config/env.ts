import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
	DATABASE_URL: z.string().url().min(1),
	HOST: z.string().min(1).default("0.0.0.0"),
	PORT: z.coerce.number().int().positive().max(65_535).default(8080),
	ORIGIN: z
		.string()
		.default("http://localhost:5678")
		.refine(
			(value) =>
				value.split(",").every((entry) => {
					try {
						const origin = entry.trim();
						const url = new URL(origin);
						return ["http:", "https:"].includes(url.protocol) && url.origin === origin;
					} catch {
						return false;
					}
				}),
			"ORIGIN must contain explicit HTTP(S) origins separated by commas; wildcards are not allowed",
		),
	LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("Invalid environment variables", z.treeifyError(parsedEnv.error));
	throw new Error("Environment validation failed");
}

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(): Env {
	if (!cachedEnv) {
		cachedEnv = envSchema.parse(process.env);
	}
	return cachedEnv;
}

export const env = validateEnv();
export const allowedOrigins = env.ORIGIN.split(",").map((origin) => origin.trim());
