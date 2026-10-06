import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SecurePayment from "./payment";
import * as api from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("checkout_id=session-test-uuid"),
}));

const mockConfirmCardPayment = vi.fn();

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue({
    confirmCardPayment: (...args: unknown[]) => mockConfirmCardPayment(...args),
  }),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="stripe-card-element" />,
  useStripe: () => ({
    confirmCardPayment: (...args: unknown[]) => mockConfirmCardPayment(...args),
  }),
  useElements: () => ({
    getElement: vi.fn().mockReturnValue({}),
  }),
}));

describe("SecurePayment smoke, PCI compliance, and UI states test", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockConfirmCardPayment.mockReset();
    vi.spyOn(api, "getCheckoutSession").mockResolvedValue({
      checkout_id: "session-test-uuid",
      client_secret: "pi_real_123_secret_abc",
      publishable_key: "pk_test_123",
      type: "MEAL_PLAN",
      type_label: "Weight Loss Meal Plan",
      price: 49.99,
      currency: "USD",
      details: {
        title: "Weight Loss Meal Plan",
        duration_days: 14,
        nutritionist_username: "Dr. Smith",
      },
    });
  });

  it("renders order summary and tokenized Stripe CardElement without raw card inputs or sandbox selectors", async () => {
    render(<SecurePayment />);

    await waitFor(() => {
      expect(screen.getByText("Order Summary")).toBeDefined();
      expect(screen.getByText("Weight Loss Meal Plan")).toBeDefined();
    });

    // Verify tokenized CardElement is rendered
    expect(screen.getByTestId("stripe-card-element")).toBeDefined();

    // Verify sandbox token selector is REMOVED
    expect(screen.queryByText(/Sandbox Test Selector/i)).toBeNull();
    expect(screen.queryByText(/Test Visa 4242/i)).toBeNull();
    expect(screen.queryByText(/Test Mastercard 5555/i)).toBeNull();

    // Crucial PCI-DSS SAQ-A check: ensure NO raw card number or CVV inputs exist in DOM
    const rawCardInputs = document.querySelectorAll(
      'input[id="cardNumber"], input[name="cardNumber"], input[id="cvc"], input[name="cvc"], input[id="expiry"], input[name="expiry"]'
    );
    expect(rawCardInputs.length).toBe(0);
  });

  it("renders succeeded state when payment and confirmation succeed", async () => {
    mockConfirmCardPayment.mockResolvedValue({
      paymentIntent: { id: "pi_succeeded_999", status: "succeeded" },
    });

    vi.spyOn(api, "confirmCheckoutSession").mockResolvedValue({
      status: "success",
      data: { status: "confirmed", checkout_id: "session-test-uuid" },
    });

    render(<SecurePayment />);

    await waitFor(() => {
      expect(screen.getByText("Order Summary")).toBeDefined();
    });

    const form = screen.getByTestId("payment-form").querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByTestId("state-succeeded")).toBeDefined();
      expect(screen.getByText("Payment Confirmed!")).toBeDefined();
    });
  });

  it("renders declined state when card confirmation fails", async () => {
    mockConfirmCardPayment.mockResolvedValue({
      error: { code: "card_declined", message: "Your card was declined by bank." },
    });

    render(<SecurePayment />);

    await waitFor(() => {
      expect(screen.getByText("Order Summary")).toBeDefined();
    });

    const form = screen.getByTestId("payment-form").querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByTestId("state-declined")).toBeDefined();
      expect(screen.getByText("Your card was declined by bank.")).toBeDefined();
    });
  });

  it("renders requires_action state when 3D Secure authentication is needed", async () => {
    mockConfirmCardPayment.mockResolvedValue({
      error: { code: "authentication_required", message: "Authentication required by card issuer." },
    });

    render(<SecurePayment />);

    await waitFor(() => {
      expect(screen.getByText("Order Summary")).toBeDefined();
    });

    const form = screen.getByTestId("payment-form").querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByTestId("state-requires-action")).toBeDefined();
      expect(screen.getByText(/3D Secure/i)).toBeDefined();
    });
  });

  it("renders expired session state when session is expired on load", async () => {
    vi.spyOn(api, "getCheckoutSession").mockResolvedValue({
      checkout_id: "session-test-uuid",
      status: "expired",
      type: "MEAL_PLAN",
      type_label: "Weight Loss Meal Plan",
      price: 49.99,
      currency: "USD",
      details: {},
    });

    render(<SecurePayment />);

    await waitFor(() => {
      expect(screen.getByTestId("state-expired-session")).toBeDefined();
      expect(screen.getByText(/Checkout Session Expired/i)).toBeDefined();
    });
  });
});
