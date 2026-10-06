import { ApiError, request } from "../../lib/api";

export type Session = {
  user: { publicId: string; username: string; email: string; role: string };
  expiresAt: string;
  refreshExpiresAt: string;
};
type AuthResponse = { message: string; data: Session };
export type LoginInput = { username: string; password: string };

export async function getSession(
  signal?: AbortSignal,
): Promise<Session | null> {
  try {
    const response = await request<AuthResponse>("/auth/session", { signal });
    return response.data;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    try {
      const response = await request<AuthResponse>("/auth/refresh", {
        method: "POST",
        signal,
      });
      return response.data;
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401)
        return null;
      throw refreshError;
    }
  }
}

export async function login(input: LoginInput): Promise<Session> {
  const response = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
}
