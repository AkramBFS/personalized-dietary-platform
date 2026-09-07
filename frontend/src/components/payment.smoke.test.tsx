import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import SecurePayment from "./payment";
import * as api from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("checkout_id=session-test-uuid"),
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue({
    createPaymentMethod: vi.fn(),
  }),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="stripe-card-element" />,
  useStripe: () => ({
    createPaymentMethod: vi.fn().mockResolvedValue({ paymentMethod: { id: "pm_test_123" } }),
  }),
  useElements: () => ({
    getElement: vi.fn().mockReturnValue({}),
  }),
}));

describe("SecurePayment smoke and PCI compliance test", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "getCheckoutSession").mockResolvedValue({
      checkout_id: "session-test-uuid",
      type: "MEAL_PLAN",
      type_label: "Weight Loss Meal Plan",
      price: 49.99,
      currency: "USD",
      status: "pending",
      details: {
        title: "Weight Loss Meal Plan",
        duration_days: 14,
        nutritionist_username: "Dr. Smith",
      },
    });
  });

  it("renders order summary and tokenized Stripe elements without raw card inputs", async () => {
    render(<SecurePayment />);

    await waitFor(() => {
      expect(screen.getByText("Order Summary")).toBeDefined();
      expect(screen.getByText("Weight Loss Meal Plan")).toBeDefined();
    });

    // Verify tokenized CardElement is rendered
    expect(screen.getByTestId("stripe-card-element")).toBeDefined();

    // Verify sandbox token selector is rendered
    expect(screen.getByText(/Sandbox Test Selector/i)).toBeDefined();
    expect(screen.getByText(/Test Visa 4242/i)).toBeDefined();
    expect(screen.getByText(/Test Mastercard 5555/i)).toBeDefined();

    // Crucial PCI-DSS SAQ-A check: ensure NO raw card number or CVV inputs exist in DOM
    const rawCardInputs = document.querySelectorAll('input[id="cardNumber"], input[name="cardNumber"], input[id="cvc"], input[name="cvc"], input[id="expiry"], input[name="expiry"]');
    expect(rawCardInputs.length).toBe(0);
  });
});
