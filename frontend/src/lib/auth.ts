import { InternalAxiosRequestConfig } from "axios";

export type UserRole = "client" | "nutritionist" | "high_admin";

export interface SessionUser {
  id?: number;
  role: UserRole;
  username?: string;
  email?: string;
}

const SESSION_USER_KEY = "dieton_user";

// Helper strictly for extracting cookies on the client side
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

// Interceptor utility injected into API definition
export function withAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getCookie("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

export function setAccessToken(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `access_token=${token}; path=/; max-age=3600`;
  }
}

export function setRefreshToken(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `refresh_token=${token}; path=/; max-age=604800`; // 7 days
  }
}

export function hasAccessToken(): boolean {
  return Boolean(getCookie("access_token"));
}

export function setSessionUser(user: SessionUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (parsed?.role === "client" || parsed?.role === "nutritionist" || parsed?.role === "high_admin") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function clearAuthSession() {
  if (typeof document !== "undefined") {
    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "refresh_token=; path=/; max-age=0";
  }
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_USER_KEY);
  }
}
