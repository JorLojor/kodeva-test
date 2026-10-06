import { createHash, randomBytes } from "node:crypto";

export function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function createSessionTokens() {
	const accessToken = randomBytes(32).toString("hex");
	const refreshToken = randomBytes(32).toString("hex");
	const now = Date.now();
	return {
		accessToken,
		refreshToken,
		accessTokenHash: hashToken(accessToken),
		refreshTokenHash: hashToken(refreshToken),
		expiresAt: new Date(now + 15 * 60 * 1000),
		refreshExpiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
	};
}
