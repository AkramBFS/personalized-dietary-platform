import { describe, it, expect } from "vitest";
import {
  buildPaymentUrl,
  parseCheckoutId,
  parsePaymentContext,
  generateTransactionNumber,
  formatPaymentAmount,
  getSubscriptionAmount,
} from "./payment";

describe("payment utility", () => {
  it("builds payment url for checkout session string id", () => {
    const url = buildPaymentUrl("checkout-session-12345");
    expect(url).toBe("/payment?checkout_id=checkout-session-12345");
  });

  it("builds payment url for legacy marketplace plan", () => {
    const url = buildPaymentUrl({
      type: "marketplace-plan",
      planId: 42,
    });
    expect(url).toBe("/payment?type=marketplace-plan&planId=42");
  });

  it("builds payment url for legacy consultation", () => {
    const url = buildPaymentUrl({
      type: "consultation",
      nutritionistId: 7,
      appointmentDate: "2026-10-10",
      startTime: "10:00",
      endTime: "11:00",
      consultationType: "advice_only",
      amount: 60,
    });
    expect(url).toContain("type=consultation");
    expect(url).toContain("nutritionistId=7");
    expect(url).toContain("appointmentDate=2026-10-10");
    expect(url).toContain("consultationType=advice_only");
  });

  it("parses checkout id correctly from search params", () => {
    const params = new URLSearchParams("checkout_id=cs_test_abc123");
    expect(parseCheckoutId(params)).toBe("cs_test_abc123");

    const emptyParams = new URLSearchParams("");
    expect(parseCheckoutId(emptyParams)).toBeNull();
  });

  it("parses payment context for marketplace plan", () => {
    const params = new URLSearchParams("type=marketplace-plan&planId=15");
    const context = parsePaymentContext(params);
    expect(context).toEqual({
      type: "marketplace-plan",
      planId: 15,
    });
  });

  it("parses payment context for subscription", () => {
    const params = new URLSearchParams("type=subscription&planType=yearly&amount=190");
    const context = parsePaymentContext(params);
    expect(context).toEqual({
      type: "subscription",
      planType: "yearly",
      amount: 190,
    });
  });

  it("formats payment amounts correctly", () => {
    expect(formatPaymentAmount(29.99)).toBe("$29.99");
    expect(formatPaymentAmount(0)).toBe("$0.00");
    expect(formatPaymentAmount(100)).toBe("$100.00");
  });

  it("generates transaction numbers with required prefix and random component", () => {
    const txn = generateTransactionNumber("MEAL_PLAN");
    expect(txn.startsWith("MEALPLAN-")).toBe(true);
    const parts = txn.split("-");
    expect(parts.length).toBe(3);
    expect(Number(parts[1])).toBeGreaterThan(0);
  });
});
