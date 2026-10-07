import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]),
	DATABASE_URL: z.string().url().min(1, "database url not set"),
	HOST: z.string().min(1),
	PORT: z.coerce.number().int().positive().max(65_535),
	ORIGIN: z.string().refine(
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
	LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),
	CDN_REGION: z.string().min(1, "cdn region not set"),
	CDN_ACCESS_KEY_ID: z.string().min(1, "cdn access key id not set"),
	CDN_SECRET: z.string().min(1, "cdn secret not set"),
	CDN_BUCKET: z.string().min(1, "cdn bucket not set"),
	CDN_ENDPOINT: z.string().min(1, "cdn endpoint not set"),
	CDN_PUBLIC_URL: z.string().min(1, "cdn public url not set"),
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
