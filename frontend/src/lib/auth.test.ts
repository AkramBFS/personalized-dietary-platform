import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  setAccessToken,
  setRefreshToken,
  setUserRoleCookie,
  getCookie,
  clearAuthSession,
  setSessionUser,
  getSessionUser,
  hasAccessToken,
} from "./auth";

describe("auth utility", () => {
  beforeEach(() => {
    // Clear cookies and localStorage
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets access token cookie with SameSite=Lax", () => {
    setAccessToken("test-access-token-123");
    expect(getCookie("access_token")).toBe("test-access-token-123");
    expect(hasAccessToken()).toBe(true);
  });

  it("sets refresh token cookie", () => {
    setRefreshToken("test-refresh-token-456");
    expect(getCookie("refresh_token")).toBe("test-refresh-token-456");
  });

  it("sets user role cookie", () => {
    setUserRoleCookie("client");
    expect(getCookie("user_role")).toBe("client");
  });

  it("stores and retrieves session user from localStorage", () => {
    const user = { id: 1, role: "client" as const, username: "john_doe" };
    setSessionUser(user);
    const retrieved = getSessionUser();
    expect(retrieved).toEqual(user);
  });

  it("clears auth session and calls server logout when refresh token is present", async () => {
    setAccessToken("test-access-token");
    setRefreshToken("test-refresh-token");
    setUserRoleCookie("client");
    setSessionUser({ id: 1, role: "client", username: "john_doe" });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "success" }),
    } as Response);

    await clearAuthSession(true);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("auth/logout/"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-access-token",
        }),
        body: JSON.stringify({ refresh: "test-refresh-token" }),
      })
    );

    expect(getCookie("access_token")).toBeNull();
    expect(getCookie("refresh_token")).toBeNull();
    expect(getCookie("user_role")).toBeNull();
    expect(getSessionUser()).toBeNull();
  });

  it("clears auth session without calling server logout when callServerLogout is false", async () => {
    setAccessToken("test-access-token");
    setRefreshToken("test-refresh-token");

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await clearAuthSession(false);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getCookie("access_token")).toBeNull();
    expect(getCookie("refresh_token")).toBeNull();
  });
});
