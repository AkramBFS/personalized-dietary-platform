import { describe, it, expect } from "vitest";
import { resolveApiUrl } from "./api";

describe("resolveApiUrl Media Resolution", () => {
  it("returns undefined for falsy inputs", () => {
    expect(resolveApiUrl(undefined)).toBeUndefined();
    expect(resolveApiUrl(null)).toBeUndefined();
    expect(resolveApiUrl("")).toBeUndefined();
  });

  it("preserves blob and data URLs", () => {
    expect(resolveApiUrl("blob:http://localhost:3000/123")).toBe("blob:http://localhost:3000/123");
    expect(resolveApiUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });

  it("routes relative storage paths through the /api/backend/media proxy", () => {
    expect(resolveApiUrl("profiles/clients/avatar.png")).toBe("/api/backend/media/profiles/clients/avatar.png");
    expect(resolveApiUrl("/media/profiles/clients/avatar.png")).toBe("/api/backend/media/profiles/clients/avatar.png");
    expect(resolveApiUrl("media/certifications/cert.pdf")).toBe("/api/backend/media/certifications/cert.pdf");
    expect(resolveApiUrl("default_avatar.png")).toBe("/api/backend/media/default_avatar.png");
  });

  it("normalizes localhost backend URLs to the same-origin proxy", () => {
    expect(resolveApiUrl("http://127.0.0.1:8000/media/plans/covers/c.jpg")).toBe(
      "/api/backend/media/plans/covers/c.jpg"
    );
    expect(resolveApiUrl("http://localhost:8000/media/profiles/clients/pic.png")).toBe(
      "/api/backend/media/profiles/clients/pic.png"
    );
  });

  it("preserves external third-party CDN URLs", () => {
    expect(resolveApiUrl("https://images.unsplash.com/photo-123")).toBe(
      "https://images.unsplash.com/photo-123"
    );
  });

  it("does not duplicate /api/backend/media if already present", () => {
    expect(resolveApiUrl("/api/backend/media/profiles/clients/avatar.png")).toBe(
      "/api/backend/media/profiles/clients/avatar.png"
    );
  });
});
