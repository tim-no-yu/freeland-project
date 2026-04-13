import { apiClient } from "./client";
import { mockReporter, mockVerifier } from "@/lib/mocks/users";
import type { LoginPayload, LoginResponse, User } from "@/lib/types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// Detect which backend we're talking to based on the base URL
function isLocalBackend(): boolean {
  const url = process.env.NEXT_PUBLIC_API_URL || "";
  return url.includes("/api/v1");
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  if (USE_MOCKS) {
    const user = payload.email.includes("verifier") ? mockVerifier : mockReporter;
    const res: LoginResponse = {
      access: "mock-access-token",
      refresh: "mock-refresh-token",
      user,
    };
    localStorage.setItem("access_token", res.access);
    localStorage.setItem("refresh_token", res.refresh);
    return res;
  }

  // Local backend: POST /auth/login/ | Tim's backend: POST /auth/token/
  const loginPath = isLocalBackend() ? "/auth/login/" : "/auth/token/";
  const { data: tokenData } = await apiClient.post<{ access: string; refresh: string }>(
    loginPath,
    { username: payload.email, password: payload.password },
  );
  localStorage.setItem("access_token", tokenData.access);
  localStorage.setItem("refresh_token", tokenData.refresh);

  // Fetch user profile if local backend has /auth/me/, otherwise construct from email
  let user: User;
  if (isLocalBackend()) {
    user = await getCurrentUser();
  } else {
    user = {
      id: 0,
      email: payload.email,
      name: payload.email.split("@")[0],
      role: "reporter",
    };
  }
  localStorage.setItem("current_user", JSON.stringify(user));
  return { ...tokenData, user };
}

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCKS) {
    return mockReporter;
  }
  if (isLocalBackend()) {
    const { data } = await apiClient.get<User>("/auth/me/");
    return data;
  }
  const stored = localStorage.getItem("current_user");
  if (stored) return JSON.parse(stored);
  return { id: 0, email: "", name: "User", role: "reporter" };
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
  window.location.href = "/login";
}
