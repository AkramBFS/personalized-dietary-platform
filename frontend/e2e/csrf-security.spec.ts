import { test, expect } from "@playwright/test";

test.describe("BFF Proxy CSRF & Cross-Origin Security", () => {
  test("rejects forged cross-origin mutating requests with HTTP 403 CSRF_FORBIDDEN", async ({ request, baseURL }) => {
    const targetUrl = `${baseURL || "http://localhost:3000"}/api/backend/auth/login/`;

    const response = await request.post(targetUrl, {
      headers: {
        origin: "https://evil-attacker.com",
        "x-requested-with": "XMLHttpRequest",
        "content-type": "application/json",
      },
      data: {
        email: "test@example.com",
        password: "Password123!",
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.status).toBe("error");
    expect(body.error_code).toBe("CSRF_FORBIDDEN");
    expect(body.message).toContain("Cross-site request forgery validation failed");
  });

  test("rejects scriptless form posts missing X-Requested-With header with HTTP 403", async ({ request, baseURL }) => {
    const targetUrl = `${baseURL || "http://localhost:3000"}/api/backend/auth/login/`;

    const response = await request.post(targetUrl, {
      headers: {
        origin: baseURL || "http://localhost:3000",
        // Deliberately omitting X-Requested-With header
        "content-type": "application/json",
      },
      data: {
        email: "test@example.com",
        password: "Password123!",
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.status).toBe("error");
    expect(body.error_code).toBe("CSRF_FORBIDDEN");
  });

  test("permits legitimate same-origin requests with X-Requested-With header through CSRF shield", async ({ request, baseURL }) => {
    const targetUrl = `${baseURL || "http://localhost:3000"}/api/backend/auth/login/`;

    const response = await request.post(targetUrl, {
      headers: {
        origin: baseURL || "http://localhost:3000",
        "x-requested-with": "XMLHttpRequest",
        "content-type": "application/json",
      },
      data: {
        email: "test@example.com",
        password: "Password123!",
      },
    });

    // The request must pass the CSRF barrier (must NOT be 403 CSRF_FORBIDDEN)
    expect(response.status()).not.toBe(403);
    if (response.status() === 400 || response.status() === 401) {
      const body = await response.json().catch(() => ({}));
      expect(body.error_code).not.toBe("CSRF_FORBIDDEN");
    }
  });
});
