import { api, ApiError } from "@/lib/api";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@/types";

export type RegisterResponse = { message: string };

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // Access + refresh tokens are set as httpOnly cookies by the backend response.
  return api.post<AuthResponse>("/auth/login", payload);
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  // Returns a message only — no tokens until email is verified.
  return api.post<RegisterResponse>("/auth/register", payload);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw new Error("Unable to load the current user.");
  }
}

export function hasStoredSession(): boolean {
  // With httpOnly cookies we cannot inspect the token from JS.
  // Always attempt /auth/me and let the server decide.
  return true;
}

export async function signOut(): Promise<void> {
  // Backend clears httpOnly cookies via Set-Cookie response headers.
  await api.post("/auth/logout").catch(() => undefined);
}

export async function resendVerification(email: string): Promise<void> {
  await api.post("/auth/resend-verification", { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, new_password: newPassword });
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post("/auth/verify-email", { token });
}
