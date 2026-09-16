import { test, expect } from "@playwright/test";

test.describe("Authentication & Navigation Flow", () => {
  test("loads the landing page with navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dieton|DietOn|NutriPlatform|Personalized/i);
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
  });

  test("navigates to login page and displays credentials form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=\"email\"], input[name=\"email\"], input#email")).toBeVisible();
    await expect(page.locator("input[type=\"password\"], input[name=\"password\"], input#password")).toBeVisible();
  });

  test("validates required fields on empty login submission", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.locator("button[type=\"submit\"]");
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test("handles unauthenticated redirect on /client dashboard", async ({ page }) => {
    await page.goto("/client");
    await page.waitForURL(/\/login|\/signin|\/auth/i);
    const url = page.url();
    expect(url).toMatch(/\/login|\/signin|\/auth/i);
  });

  test("verifies /dashboard performs redirect rather than showing prototype", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL((url) => !url.pathname.endsWith("/dashboard"));
    const url = page.url();
    expect(url).not.toContain("/dashboard");
  });
});
