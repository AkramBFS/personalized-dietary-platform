import { InternalAxiosRequestConfig } from "axios";

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
