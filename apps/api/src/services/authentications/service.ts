import { clearAuthCookies, readAuthCookie, setAuthCookies } from "@/lib/auth-cookies";
import { AppError } from "@/lib/error";
import { createSessionTokens, hashToken } from "@/lib/session";
import { LoginDto } from "@/services/authentications/dto";
import * as repository from "@/services/authentications/repository";
import BaseService from "@/services/base.service";
import { unwrapRepositoryResult } from "@/services/repository-result";
import { parseBody } from "@/services/validation";
import { log } from "@/utils/logger";
import { createLoginLimiter } from "@/utils/login-limiter";

const dummyHash = Bun.password.hash("unusable-dummy-password", { algorithm: "argon2id" });

const limitLogin = createLoginLimiter();

export default class AuthenticationService extends BaseService {
	async login() {
		try {
			this.context.header("Cache-Control", "no-store");
			const input = await parseBody(this.context, LoginDto);
			log.info({ username: input.username }, "Attempting login for user");
			const limitError = limitLogin(input.username);
			if (limitError) {
				throw AppError.tooManyRequests(limitError);
			}

			const credentials = unwrapRepositoryResult(await repository.findCredentials(input.username));
			const valid = await Bun.password.verify(
				input.password,
				credentials?.password ?? (await dummyHash),
			);

			if (!credentials || !valid)
				throw AppError.unauthorized("Invalid username or password", "INVALID_CREDENTIALS");

			const tokens = createSessionTokens();
			const user = unwrapRepositoryResult(
				await repository.createSession(credentials.id, credentials.password, {
					id: crypto.randomUUID(),
					accessToken: tokens.accessTokenHash,
					refreshToken: tokens.refreshTokenHash,
					expiresAt: tokens.expiresAt,
					refreshExpiresAt: tokens.refreshExpiresAt,
				}),
			);

			if (!user) throw AppError.unauthorized("Invalid username or password", "INVALID_CREDENTIALS");
			setAuthCookies(this.context, tokens);
			return this.success({
				message: "Login successful",
				data: {
					expiresAt: tokens.expiresAt,
					refreshExpiresAt: tokens.refreshExpiresAt,
					user,
				},
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async refresh() {
		try {
			this.context.header("Cache-Control", "no-store");
			const refreshToken = readAuthCookie(this.context, "refreshToken");
			if (!refreshToken)
				throw AppError.unauthorized(
					"Refresh cookie is missing or invalid",
					"INVALID_REFRESH_TOKEN",
				);
			const tokens = createSessionTokens();
			const session = unwrapRepositoryResult(
				await repository.rotateSession(hashToken(refreshToken), {
					accessToken: tokens.accessTokenHash,
					refreshToken: tokens.refreshTokenHash,
					expiresAt: tokens.expiresAt,
				}),
			);
			if (!session)
				throw AppError.unauthorized("Refresh token expired or invalid", "INVALID_REFRESH_TOKEN");
			setAuthCookies(this.context, {
				...tokens,
				expiresAt: session.expiresAt,
				refreshExpiresAt: session.refreshExpiresAt,
			});
			return this.success({
				message: "Session refreshed",
				data: {
					...session,
				},
			});
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async session() {
		try {
			this.context.header("Cache-Control", "no-store");
			log.info({ userId: this.context.get("authUser")?.id }, "Refreshing session for user");
			const session = unwrapRepositoryResult(
				await repository.getSession(this.context.get("sessionId"), this.context.get("authUser").id),
			);
			if (!session) throw AppError.unauthorized("Session expired or invalid");
			return this.success({ message: "Session active", data: session });
		} catch (error) {
			return this.failFromError(error);
		}
	}

	async logout() {
		try {
			this.context.header("Cache-Control", "no-store");
			const accessToken = readAuthCookie(this.context, "accessToken");
			const refreshToken = readAuthCookie(this.context, "refreshToken");
			unwrapRepositoryResult(
				await repository.deleteSessionByTokens(
					accessToken ? hashToken(accessToken) : undefined,
					refreshToken ? hashToken(refreshToken) : undefined,
				),
			);
			clearAuthCookies(this.context);
			return this.success({ message: "Logout successful" });
		} catch (error) {
			return this.failFromError(error);
		}
	}
}
