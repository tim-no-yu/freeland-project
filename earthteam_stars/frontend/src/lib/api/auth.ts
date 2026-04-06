import { apiClient } from "./client";
import { mockReporter, mockVerifier } from "@/lib/mocks/users";
import type { LoginPayload, LoginResponse, User } from "@/lib/types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

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

  // Tim's backend: POST /api/auth/token/ with { username, password }
  const { data: tokenData } = await apiClient.post<{ access: string; refresh: string }>(
    "/auth/token/",
    { username: payload.email, password: payload.password },
  );
  localStorage.setItem("access_token", tokenData.access);
  localStorage.setItem("refresh_token", tokenData.refresh);

  // Tim's backend has no /me/ endpoint — decode user from JWT or fetch profile
  // For now, construct a minimal user from the login email
  const user: User = {
    id: 0,
    email: payload.email,
    name: payload.email.split("@")[0],
    role: "reporter",
  };
  return { ...tokenData, user };
}

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCKS) {
    return mockReporter;
  }
  // No /me/ endpoint in Tim's backend yet — return from localStorage
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
