import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import nextConfig from "../../next.config";

describe("Phase 6 Code Quality, Performance & Architecture", () => {
  describe("FE-025: Architecture & Subcomponent Decomposition", () => {
    it("exports CalorieDailySummary component", async () => {
      const mod = await import("../components/calorie-tracker/CalorieDailySummary");
      expect(typeof mod.default).toBe("function");
    });

    it("exports AIMealConfirmationModal component", async () => {
      const mod = await import("../components/calorie-tracker/AIMealConfirmationModal");
      expect(typeof mod.default).toBe("function");
    });

    it("exports MealLoggingSection component", async () => {
      const mod = await import("../components/calorie-tracker/MealLoggingSection");
      expect(typeof mod.default).toBe("function");
    });

    it("extracts mock datasets to nutritionist/mocks.ts", async () => {
      const mocks = await import("./nutritionist/mocks");
      expect(mocks.mockProfile).toBeDefined();
      expect(mocks.mockProfile.nutritionist_id).toBe(44);
      expect(mocks.mockSchedule.availability).toBeInstanceOf(Array);
      expect(mocks.mockConsultations).toHaveLength(2);
      expect(mocks.mockEarnings.total_gross).toBe(9650);
    });

    it("ensures calorie-tracker/page.tsx line count is drastically reduced", () => {
      const pagePath = path.resolve(__dirname, "../app/(main)/(dashboards)/client/calorie-tracker/page.tsx");
      const content = fs.readFileSync(pagePath, "utf-8");
      const lines = content.split("\n").length;
      // Originally 1242 lines, now under 700 lines
      expect(lines).toBeLessThan(700);
    });
  });

  describe("FE-022: Next.js Image Configuration & Optimization", () => {
    it("includes local backend origins in images.remotePatterns", () => {
      const patterns = nextConfig.images?.remotePatterns || [];
      const hosts = patterns.map((p: any) => p.hostname);
      expect(hosts).toContain("images.unsplash.com");
      expect(hosts).toContain("127.0.0.1");
      expect(hosts).toContain("localhost");

      const localPattern = patterns.find((p: any) => p.hostname === "127.0.0.1");
      expect(localPattern?.port).toBe("8000");
    });
  });

  describe("FE-020: Zero-Byte Placeholder Removal", () => {
    it("confirms src/lib/validators.ts is removed from the filesystem", () => {
      const validatorsPath = path.resolve(__dirname, "validators.ts");
      expect(fs.existsSync(validatorsPath)).toBe(false);
    });
  });

  describe("FE-019: Obsolete Prototype Route Cleanup", () => {
    it("confirms src/components/dashboard/dashboard.tsx is deleted", () => {
      const dashboardPath = path.resolve(__dirname, "../components/dashboard/dashboard.tsx");
      expect(fs.existsSync(dashboardPath)).toBe(false);
    });

    it("confirms /dashboard/page.tsx performs role-based redirects", () => {
      const pagePath = path.resolve(__dirname, "../app/(main)/dashboard/page.tsx");
      const content = fs.readFileSync(pagePath, "utf-8");
      expect(content).toContain("redirect(");
      expect(content).toContain('cookieStore.get("user_role")');
      expect(content).not.toContain("UserDashboard");
    });
  });

  describe("FE-021: Debugging console.log Removal", () => {
    it("verifies registration and form files contain no payload dumping console.log calls", () => {
      const regPath = path.resolve(__dirname, "../components/auth/Registration-Flow.tsx");
      const regContent = fs.readFileSync(regPath, "utf-8");
      expect(regContent).not.toContain('console.log("Mapped IDs:');
      expect(regContent).not.toContain('console.log("Payload:');
      expect(regContent).not.toContain('console.log(formData);');

      const countryPath = path.resolve(__dirname, "../components/forms/StepCountrySelect.tsx");
      const countryContent = fs.readFileSync(countryPath, "utf-8");
      expect(countryContent).not.toContain('console.log("Languages Prop:');
      expect(countryContent).not.toContain('console.log("Countries Prop:');

      const servicePath = path.resolve(__dirname, "./client/service.ts");
      const serviceContent = fs.readFileSync(servicePath, "utf-8");
      expect(serviceContent).not.toContain('console.log("Invoice detail response:');
    });
  });

  describe("FE-018 & FE-023: HTML Interactive Nesting & Tailwind Consistency", () => {
    it("verifies consultations.tsx does not nest <button> inside <a>", () => {
      const consultationsPath = path.resolve(__dirname, "../components/consultations.tsx");
      const content = fs.readFileSync(consultationsPath, "utf-8");
      expect(content).not.toMatch(/<a[^>]*>\s*<motion\.button/);
      expect(content).toContain('href="/consultations/nutritionists"');
    });

    it("verifies services.tsx does not have conflicting background classes", () => {
      const servicesPath = path.resolve(__dirname, "../components/services.tsx");
      const content = fs.readFileSync(servicesPath, "utf-8");
      expect(content).not.toContain("bg-button-primary bg-btn-primary");
      expect(content).toContain("bg-btn-primary");
    });
  });

  describe("FE-024: Accessible Button Names", () => {
    it("verifies icon-only delete buttons in community/page.tsx have aria-label", () => {
      const communityPath = path.resolve(__dirname, "../app/(main)/(dashboards)/client/community/page.tsx");
      const content = fs.readFileSync(communityPath, "utf-8");
      expect(content).toContain('aria-label="Delete post"');
      expect(content).toContain('aria-label="Remove image"');
    });
  });
});
