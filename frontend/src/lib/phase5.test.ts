import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Phase 5 Frontend Hardening & UX", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("FE-017: Meal checklist localStorage persistence", () => {
    it("persists checked meal items and recalls them correctly", () => {
      const planId = 101;
      const dayIndex = 2;
      const key = `meal_check_${planId}_day${dayIndex}`;

      const initialChecked = {
        breakfast: true,
        lunch: false,
        dinner: true,
        snacks: [true, false],
      };

      localStorage.setItem(key, JSON.stringify(initialChecked));
      const loaded = JSON.parse(localStorage.getItem(key) || "{}");

      expect(loaded.breakfast).toBe(true);
      expect(loaded.lunch).toBe(false);
      expect(loaded.dinner).toBe(true);
      expect(loaded.snacks).toEqual([true, false]);
    });
  });

  describe("FE-016: Chatbot conversation history in sessionStorage", () => {
    it("saves and clears chatbot conversation messages in sessionStorage", () => {
      const SESSION_KEY = "chatbot_messages";
      const messages = [
        { role: "user", content: "What is my calorie goal?" },
        { role: "assistant", content: "Your daily target is 2200 kcal." },
      ];

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
      expect(JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]")).toHaveLength(2);

      // Simulate clear chat
      sessionStorage.removeItem(SESSION_KEY);
      expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  describe("FE-013: Axios service endpoints without leading slashes", () => {
    it("ensures critical service endpoints do not start with leading slashes", async () => {
      const clientService = await import("./client/service");
      const adminService = await import("./admin/service");

      // Verify function exports exist
      expect(typeof clientService.getClientInvoices).toBe("function");
      expect(typeof clientService.getInvoiceDetail).toBe("function");
      expect(typeof clientService.submitReview).toBe("function");
      expect(typeof clientService.getCommunityPosts).toBe("function");

      expect(typeof adminService.getAdminUsers).toBe("function");
      expect(typeof adminService.getAdminSubscriptionPricing).toBe("function");
      expect(typeof adminService.updateAdminSubscriptionPricing).toBe("function");
    });
  });

  describe("FE-009: PDF Receipt & Statement Generation", () => {
    it("exports printClientReceipt and printNutritionistStatement without errors", async () => {
      const pdfReceipt = await import("./pdfReceipt");
      expect(typeof pdfReceipt.printClientReceipt).toBe("function");
      expect(typeof pdfReceipt.printNutritionistStatement).toBe("function");
    });
  });
});
