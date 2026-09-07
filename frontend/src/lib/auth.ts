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

function getSecurityFlags(): string {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "; SameSite=Lax; Secure";
  }
  return "; SameSite=Lax";
}

export function setAccessToken(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `access_token=${token}; path=/; max-age=3600${getSecurityFlags()}`;
  }
}

export function setRefreshToken(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `refresh_token=${token}; path=/; max-age=604800${getSecurityFlags()}`; // 7 days
  }
}

export function setUserRoleCookie(role: string) {
  if (typeof document !== "undefined") {
    document.cookie = `user_role=${role}; path=/; max-age=604800${getSecurityFlags()}`;
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

export async function clearAuthSession(callServerLogout: boolean = true) {
  if (callServerLogout && typeof document !== "undefined") {
    const refresh = getCookie("refresh_token");
    if (refresh) {
      try {
        const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1/";
        const apiBase = rawUrl.endsWith("/") ? rawUrl : `${rawUrl}/`;
        const access = getCookie("access_token");
        await fetch(`${apiBase}auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
          },
          body: JSON.stringify({ refresh }),
        });
      } catch (err) {
        console.error("Failed to revoke token on server:", err);
      }
    }
  }

  if (typeof document !== "undefined") {
    const security = getSecurityFlags();
    document.cookie = `access_token=; path=/; max-age=0${security}`;
    document.cookie = `refresh_token=; path=/; max-age=0${security}`;
    document.cookie = `user_role=; path=/; max-age=0${security}`;
  }
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_USER_KEY);
  }
}

