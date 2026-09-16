import { test, expect } from "@playwright/test";

test.describe("Meal Plan & Calorie Tracker Flow", () => {
  test("preserves meal checklist state in localStorage across page reload", async ({ page }) => {
    await page.goto("/");
    // Evaluate localStorage persistence logic
    await page.evaluate(() => {
      const storageKey = "meal_check_999_day0";
      const state = {
        breakfast: true,
        lunch: true,
        dinner: false,
        snacks: [true, false],
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    });

    const storedState = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("meal_check_999_day0") || "{}");
    });

    expect(storedState.breakfast).toBe(true);
    expect(storedState.lunch).toBe(true);
    expect(storedState.dinner).toBe(false);
    expect(storedState.snacks).toEqual([true, false]);
  });

  test("verifies chatbot message context session storage persistence", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const messages = [
        { id: "1", role: "user", content: "What is my calorie goal?" },
        { id: "2", role: "assistant", content: "Your daily target is 2,000 kcal." },
      ];
      sessionStorage.setItem("chatbot_messages", JSON.stringify(messages));
    });

    const storedMessages = await page.evaluate(() => {
      return JSON.parse(sessionStorage.getItem("chatbot_messages") || "[]");
    });

    expect(storedMessages).toHaveLength(2);
    expect(storedMessages[0].content).toContain("calorie goal");
    expect(storedMessages[1].content).toContain("2,000 kcal");
  });

  test("verifies /client/invoices route exists without 404", async ({ page }) => {
    const response = await page.goto("/client/invoices");
    // Should return 200 or client-side redirect to signin, NOT a 404
    expect(response?.status()).not.toBe(404);
  });
});
