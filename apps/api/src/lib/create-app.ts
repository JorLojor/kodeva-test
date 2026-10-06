import { Hono } from "hono";

import type { AppEnv } from "@/types/app";

export function createRouter() {
	return new Hono<AppEnv>({ strict: false });
}

export function createApp() {
	return createRouter();
}
