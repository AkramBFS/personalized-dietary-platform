import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { verifyTurnstileToken } from "./turnstile";
import nextConfig from "../../next.config";
import { validateCsrf } from "../app/api/backend/[...path]/route";


describe("Phase 5: Transport, Session & Bot Hardening", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.ALLOWED_TURNSTILE_HOSTNAMES;
  });

  describe("Phase 5C: Turnstile Server-Side Validation", () => {
    it("bypasses gracefully when TURNSTILE_SECRET_KEY is omitted in local dev", async () => {
      const result = await verifyTurnstileToken(null);
      expect(result.success).toBe(true);
    });

    it("rejects when TURNSTILE_SECRET_KEY is set but token is missing", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test_secret_key";
      const result = await verifyTurnstileToken(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain("missing");
    });

    it("verifies valid token and matches allowed hostnames", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test_secret_key";
      process.env.ALLOWED_TURNSTILE_HOSTNAMES = "localhost,dieton.com";

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          hostname: "localhost",
        }),
      } as any);

      const result = await verifyTurnstileToken("valid_token", "127.0.0.1");
      expect(result.success).toBe(true);
    });

    it("rejects token with unauthorized hostname", async () => {
      process.env.TURNSTILE_SECRET_KEY = "test_secret_key";
      process.env.ALLOWED_TURNSTILE_HOSTNAMES = "dieton.com";

      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          hostname: "evil-phishing.com",
        }),
      } as any);

      const result = await verifyTurnstileToken("valid_token", "127.0.0.1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("evil-phishing.com");
    });
  });

  describe("Phase 5D: Next.js Security Headers & CSP Configuration", () => {
    it("configures all critical security headers including HSTS, nosniff, DENY, and CSP", async () => {
      expect(typeof nextConfig.headers).toBe("function");

      const headerGroups = await nextConfig.headers!();
      expect(headerGroups.length).toBeGreaterThan(0);

      const globalHeaders = headerGroups[0].headers;
      const headerMap = new Map(globalHeaders.map((h: { key: string; value: string }) => [h.key, h.value]));

      expect(headerMap.get("Strict-Transport-Security")).toContain("max-age=63072000");
      expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headerMap.get("X-Frame-Options")).toBe("DENY");
      expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(headerMap.get("Permissions-Policy")).toContain("camera=()");

      const csp = headerMap.get("Content-Security-Policy");
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("challenges.cloudflare.com");
      expect(csp).toContain("js.stripe.com");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe("Phase 5B: BFF Anti-CSRF Validation", () => {
    it("permits safe HTTP methods unconditionally", () => {
      const getReq = new NextRequest("http://localhost:3000/api/backend/client/profile/", { method: "GET" });
      expect(validateCsrf(getReq)).toBe(true);

      const headReq = new NextRequest("http://localhost:3000/api/backend/client/profile/", { method: "HEAD" });
      expect(validateCsrf(headReq)).toBe(true);

      const optReq = new NextRequest("http://localhost:3000/api/backend/client/profile/", { method: "OPTIONS" });
      expect(validateCsrf(optReq)).toBe(true);
    });

    it("rejects mutating requests from an untrusted cross-origin domain", () => {
      const postReq = new NextRequest("http://localhost:3000/api/backend/client/profile/", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "https://evil-attacker.com",
          "x-requested-with": "XMLHttpRequest",
        },
      });
      expect(validateCsrf(postReq)).toBe(false);
    });

    it("rejects mutating requests with an untrusted referer header", () => {
      const putReq = new NextRequest("http://localhost:3000/api/backend/client/profile/", {
        method: "PUT",
        headers: {
          host: "localhost:3000",
          referer: "https://phishing-site.org/malicious-form",
          "x-requested-with": "XMLHttpRequest",
        },
      });
      expect(validateCsrf(putReq)).toBe(false);
    });

    it("rejects mutating requests missing the X-Requested-With header even if same-origin", () => {
      const postReq = new NextRequest("http://localhost:3000/api/backend/client/profile/", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
        },
      });
      expect(validateCsrf(postReq)).toBe(false);
    });

    it("permits mutating requests when origin matches host and X-Requested-With is present", () => {
      const postReq = new NextRequest("http://localhost:3000/api/backend/client/profile/", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "x-requested-with": "XMLHttpRequest",
        },
      });
      expect(validateCsrf(postReq)).toBe(true);
    });
  });
});

