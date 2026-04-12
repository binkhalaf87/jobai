import { api, ApiError, clearApiToken, clearUserRole, hasApiToken, setApiToken } from "@/lib/api";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@/types";

export function storeAccessToken(token: string): void {
  setApiToken(token);
}


export function clearAccessToken(): void {
  clearApiToken();
}


export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", payload);
  storeAccessToken(response.access_token);
  return response;
}


export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", payload);
  storeAccessToken(response.access_token);
  return response;
}


export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!hasApiToken()) {
    return null;
  }

  try {
    return await api.get<AuthUser>("/auth/me", { auth: true });
  } catch (error) {
    clearAccessToken();

    if (error instanceof ApiError) {
      throw new Error(error.detail);
    }

    throw new Error("Unable to load the current user.");
  }
}


export function hasStoredSession(): boolean {
  return hasApiToken();
}


export function signOut(): void {
  clearAccessToken();
  clearUserRole();
}
