import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "@/config/env";

const cookiePaths = { accessToken: "/api/v1", refreshToken: "/api/v1/auth" } as const;
type AuthCookieName = keyof typeof cookiePaths;

function options(name: AuthCookieName) {
	return {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: "Lax" as const,
		path: cookiePaths[name],
	};
}

export function readAuthCookie(context: Context, name: AuthCookieName): string | undefined {
	const value = getCookie(context, name);
	return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

export function setAuthCookies(
	context: Context,
	tokens: {
		accessToken: string;
		refreshToken: string;
		expiresAt: Date;
		refreshExpiresAt: Date;
	},
) {
	for (const name of ["accessToken", "refreshToken"] as const) {
		const expires = name === "accessToken" ? tokens.expiresAt : tokens.refreshExpiresAt;
		setCookie(context, name, tokens[name], {
			...options(name),
			expires,
			maxAge: Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000)),
		});
	}
}

export function clearAuthCookies(context: Context) {
	for (const name of ["accessToken", "refreshToken"] as const) {
		deleteCookie(context, name, options(name));
	}
}
