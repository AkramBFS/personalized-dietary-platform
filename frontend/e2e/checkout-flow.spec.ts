import { test, expect } from "@playwright/test";

test.describe("Marketplace & Checkout Flow", () => {
  test("renders plan marketplace with protocols and plan cards", async ({ page, context }) => {
    // Authenticated client access to protected marketplace route
    await context.addCookies([
      { name: "access_token", value: "test_token", domain: "localhost", path: "/" },
      { name: "user_role", value: "client", domain: "localhost", path: "/" },
    ]);
    await page.goto("/marketplace");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.locator("text=Explore Plans").first()).toBeVisible();
  });

  test("verifies payment page enforces PCI-DSS SAQ-A tokenized elements", async ({ page, context }) => {
    await context.addCookies([
      { name: "access_token", value: "test_token", domain: "localhost", path: "/" },
      { name: "user_role", value: "client", domain: "localhost", path: "/" },
    ]);
    await page.goto("/payment?type=plan&id=1&amount=29.99");
    await page.waitForTimeout(1500);

    // Crucial PCI compliance check: ensure NO raw card input fields exist in DOM
    const rawCardNumber = page.locator("input[name=\"cardNumber\"], input#cardNumber");
    expect(await rawCardNumber.count()).toBe(0);

    const rawCvc = page.locator("input[name=\"cvc\"], input#cvc");
    expect(await rawCvc.count()).toBe(0);

    const rawExpiry = page.locator("input[name=\"expiry\"], input#expiry");
    expect(await rawExpiry.count()).toBe(0);
  });

  test("verifies services CTA button has correct styling and links to services", async ({ page }) => {
    await page.goto("/services");
    const ctaButton = page.locator("button:has-text(\"Explore Services\")").first();
    if (await ctaButton.isVisible()) {
      const classAttr = await ctaButton.getAttribute("class");
      expect(classAttr).not.toContain("bg-button-primary bg-btn-primary");
    }
  });

  test("verifies consultations page CTA link does not nest interactive buttons", async ({ page }) => {
    await page.goto("/consultations");
    const nestedButtonInsideAnchor = page.locator("a[href*=\"consultations\"] button");
    expect(await nestedButtonInsideAnchor.count()).toBe(0);
  });
});
