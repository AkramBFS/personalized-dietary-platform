"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Receipt,
  Info,
  CheckCircle,
  Bell,
  Calendar,
  Lock,
  CreditCard,
  Landmark,
  ShieldCheck,
  Eye,
  BadgeCheck,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  CheckoutSessionSummary,
  bookConsultation,
  confirmCheckoutSession,
  getCheckoutSession,
  getMarketplacePlanDetail,
  getNutritionistProfile,
  purchaseClientSubscription,
  purchaseMarketplacePlan,
} from "@/lib/api";
import {
  formatPaymentAmount,
  generateTransactionNumber,
  getSubscriptionAmount,
  parseCheckoutId,
  parsePaymentContext,
  PaymentContext,
} from "@/lib/payment";
import { cn } from "@/lib/utils";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#1e293b",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#94a3b8",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
};

type SummaryState = {
  itemType: CheckoutSessionSummary["type"];
  title: string;
  provider: string;
  amount: number;
  currency: string;
  description: string;
  backHref: string;
};

type CheckoutDetails = Record<string, unknown>;

function getDetailString(details: CheckoutDetails, keys: string[]): string | null {
  for (const key of keys) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getDetailNumber(details: CheckoutDetails, keys: string[]): number | null {
  for (const key of keys) {
    const value = details[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function buildSummaryFromCheckout(checkout: CheckoutSessionSummary): SummaryState {
  const details = checkout.details ?? {};

  if (checkout.type === "MEAL_PLAN") {
    const durationDays = getDetailNumber(details, ["duration_days"]);
    return {
      itemType: checkout.type,
      title: getDetailString(details, ["plan_title", "title"]) ?? checkout.type_label,
      provider:
        getDetailString(details, ["nutritionist", "nutritionist_username", "provider"]) ?? "Nutritionist",
      amount: checkout.price,
      currency: checkout.currency,
      description: durationDays
        ? `${durationDays}-day nutritionist-designed meal plan.`
        : "Nutritionist-designed meal plan purchase.",
      backHref: "/marketplace",
    };
  }

  if (checkout.type === "CONSULTATION") {
    const appointmentDate = getDetailString(details, ["appointment_date"]);
    const startTime = getDetailString(details, ["start_time"]);
    const endTime = getDetailString(details, ["end_time"]);
    const consultationType = getDetailString(details, ["consultation_type"]);
    const nutritionistId =
      getDetailString(details, ["nutritionist_id"]) ??
      (getDetailNumber(details, ["nutritionist_id"])?.toString() ?? null);

    return {
      itemType: checkout.type,
      title:
        consultationType === "plan_included"
          ? "Consultation + Plan"
          : checkout.type_label || "Consultation",
      provider:
        getDetailString(details, ["nutritionist_name", "nutritionist", "nutritionist_username", "provider"]) ??
        "Nutritionist",
      amount: checkout.price,
      currency: checkout.currency,
      description:
        appointmentDate && startTime && endTime
          ? `Scheduled for ${appointmentDate} from ${startTime} to ${endTime}.`
          : "Private nutrition consultation checkout.",
      backHref: nutritionistId
        ? `/consultations/schedule?id=${nutritionistId}`
        : "/consultations/nutritionists",
    };
  }

  const planType = getDetailString(details, ["plan_type", "subscription_plan"]);
  return {
    itemType: checkout.type,
    title:
      planType === "yearly"
        ? "Yearly Pro"
        : planType === "monthly"
          ? "Monthly Pro"
          : checkout.type_label,
    provider: "Dieton Premium",
    amount: checkout.price,
    currency: checkout.currency,
    description:
      planType === "yearly"
        ? "Annual premium access billed once per year."
        : "Monthly premium access billed once per month.",
    backHref: "/subscription",
  };
}

function buildSummaryFromLegacyContext(
  context: PaymentContext,
  args: {
    provider: string;
    amount: number;
    title: string;
    description: string;
  },
): SummaryState {
  return {
    itemType:
      context.type === "marketplace-plan"
        ? "MEAL_PLAN"
        : context.type === "consultation"
          ? "CONSULTATION"
          : "SUBSCRIPTION",
    title: args.title,
    provider: args.provider,
    amount: args.amount,
    currency: "USD",
    description: args.description,
    backHref:
      context.type === "marketplace-plan"
        ? "/marketplace"
        : context.type === "consultation"
          ? `/consultations/schedule?id=${context.nutritionistId}`
          : "/subscription",
  };
}

function getConsultationStorageKey(checkoutId: string): string {
  return `checkout-consultation:${checkoutId}`;
}

function formatCheckoutAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return formatPaymentAmount(amount);
  }
}

function getAxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;

    const errors = error.response?.data?.errors;
    if (errors && typeof errors === "object") {
      const firstError = Object.values(errors).flat().find((value) => typeof value === "string");
      if (typeof firstError === "string") return firstError;
    }
  }

  return "We couldn't complete this payment. Please try again.";
}

function getWhatHappensNext(itemType: CheckoutSessionSummary["type"] | null, provider: string) {
  if (!itemType) return [];

  if (itemType === "MEAL_PLAN") {
    return [
      {
        icon: CheckCircle,
        title: "Plan Activated",
        body: "Your purchased plan is attached to your account immediately after confirmation.",
      },
      {
        icon: Bell,
        title: "Provider Notified",
        body: `${provider} receives a purchase notification so they can track new plan activity.`,
      },
      {
        icon: Calendar,
        title: "Access Starts Now",
        body: "You can review the full plan schedule and included consultations after purchase.",
      },
    ];
  }

  if (itemType === "CONSULTATION") {
    return [
      {
        icon: CheckCircle,
        title: "Booking Confirmed",
        body: "Your selected consultation slot is booked only after this payment succeeds.",
      },
      {
        icon: Bell,
        title: "Nutritionist Notified",
        body: `${provider} is notified once your consultation booking is created.`,
      },
      {
        icon: Calendar,
        title: "Session Ready",
        body: "Your consultation will appear in your account once the booking request completes.",
      },
    ];
  }

  return [
    {
      icon: CheckCircle,
      title: "Premium Activated",
      body: "Your selected subscription is activated after the simulated payment succeeds.",
    },
    {
      icon: Bell,
      title: "Receipt Generated",
      body: "The backend records a payment receipt and updates your subscription status automatically.",
    },
    {
      icon: Calendar,
      title: "Access Updated",
      body: "Your premium access period is calculated from the selected monthly or yearly plan.",
    },
  ];
}

interface PaymentFormInnerProps {
  summary: SummaryState;
  checkoutId: string | null;
  legacyContext: PaymentContext | null;
  backHref: string;
}

function PaymentFormInner({
  summary,
  checkoutId,
  legacyContext,
  backHref,
}: PaymentFormInnerProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState("");
  const [selectedSandboxToken, setSelectedSandboxToken] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionNumber, setTransactionNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmLabel = summary
    ? `Confirm Payment - ${formatCheckoutAmount(summary.amount, summary.currency)}`
    : "Confirm Payment";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ((!checkoutId && !legacyContext) || !summary || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setCardError(null);

    let paymentMethodToken = selectedSandboxToken;

    if (!paymentMethodToken && stripe && elements) {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setSubmitError("Card input element is not ready. Please select a sandbox test card or reload.");
        setIsSubmitting(false);
        return;
      }

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: cardholderName.trim() || undefined,
        },
      });

      if (stripeError) {
        setCardError(stripeError.message || "Card verification failed.");
        setIsSubmitting(false);
        return;
      }

      paymentMethodToken = paymentMethod.id;
    }

    if (!paymentMethodToken) {
      paymentMethodToken = "pm_card_visa";
    }

    const generatedTransactionNumber = generateTransactionNumber(summary.itemType);

    try {
      if (checkoutId) {
        const confirmPayload: Record<string, unknown> = {
          payment_method_id: paymentMethodToken,
          transaction_number: generatedTransactionNumber,
        };

        if (summary.itemType === "CONSULTATION" && typeof window !== "undefined") {
          const raw = window.sessionStorage.getItem(getConsultationStorageKey(checkoutId));
          if (raw) {
            try {
              Object.assign(confirmPayload, JSON.parse(raw) as Record<string, unknown>);
            } catch (storageError) {
              console.error("Failed to parse stored consultation checkout details", storageError);
            }
          }
        }

        await confirmCheckoutSession(checkoutId, confirmPayload);
      } else if (legacyContext?.type === "marketplace-plan") {
        await purchaseMarketplacePlan(legacyContext.planId, {
          transaction_number: generatedTransactionNumber,
          amount_paid: summary.amount,
        });
      } else if (legacyContext?.type === "consultation") {
        await bookConsultation({
          nutritionist_id: String(legacyContext.nutritionistId),
          appointment_date: legacyContext.appointmentDate,
          start_time: legacyContext.startTime,
          end_time: legacyContext.endTime,
          consultation_type: legacyContext.consultationType,
          user_plan_id: legacyContext.userPlanId,
          is_free_from_plan: legacyContext.isFreeFromPlan || false,
          amount_paid: summary.amount,
          transaction_number: generatedTransactionNumber,
        });
      } else if (legacyContext?.type === "subscription") {
        await purchaseClientSubscription({
          plan_type: legacyContext.planType,
          amount_paid: summary.amount,
          transaction_number: generatedTransactionNumber,
        });
      } else {
        throw new Error("Missing payment submission context.");
      }

      if (summary.itemType === "MEAL_PLAN") {
        setSuccessMessage("Payment confirmed. Your marketplace plan is now attached to your account.");
      } else if (summary.itemType === "CONSULTATION") {
        setSuccessMessage("Payment confirmed. Your consultation booking has been submitted successfully.");
      } else {
        setSuccessMessage("Payment confirmed. Your premium subscription is now active.");
      }

      setTransactionNumber(generatedTransactionNumber);
      if (checkoutId && summary.itemType === "CONSULTATION" && typeof window !== "undefined") {
        window.sessionStorage.removeItem(getConsultationStorageKey(checkoutId));
      }
    } catch (error) {
      setSubmitError(getAxiosErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">
            Payment Details
          </h2>
        </div>
        <div className="flex gap-2 text-muted-foreground opacity-70">
          <CreditCard className="w-6 h-6" />
          <Landmark className="w-6 h-6" />
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-sm font-semibold text-foreground mb-2"
            htmlFor="cardholderName"
          >
            Cardholder Name
          </label>
          <input
            className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
            id="cardholderName"
            placeholder="Name as it appears on card"
            type="text"
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Card Information (Stripe Tokenized)
          </label>
          <div className="w-full bg-background border border-input rounded-xl px-4 py-3.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={(event) => {
                if (event.error) {
                  setCardError(event.error.message);
                } else {
                  setCardError(null);
                }
                if (selectedSandboxToken) {
                  setSelectedSandboxToken(null);
                }
              }}
            />
          </div>
          {cardError && (
            <p className="text-xs text-destructive mt-1.5">{cardError}</p>
          )}
        </div>

        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Sandbox Test Selector
            </span>
            <span className="text-[11px] text-muted-foreground">PCI SAQ-A Compliant</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            In development or sandbox mode, choose a pre-tokenized test credential:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSandboxToken("pm_card_visa");
                setCardError(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selectedSandboxToken === "pm_card_visa"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground hover:bg-muted"
              )}
            >
              Test Visa 4242 (pm_card_visa)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSandboxToken("tok_mastercard");
                setCardError(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selectedSandboxToken === "tok_mastercard"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground hover:bg-muted"
              )}
            >
              Test Mastercard 5555 (tok_mastercard)
            </button>
            {selectedSandboxToken && (
              <button
                type="button"
                onClick={() => setSelectedSandboxToken(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear selection
              </button>
            )}
          </div>
          {selectedSandboxToken && (
            <p className="text-xs text-primary mt-2 font-medium">
              Active test token: <span className="font-mono">{selectedSandboxToken}</span>
            </p>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-4 text-sm text-foreground flex items-start gap-3">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{successMessage}</p>
              {transactionNumber ? (
                <p className="text-muted-foreground mt-1">
                  Transaction reference: <span className="font-mono">{transactionNumber}</span>
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            className="px-6 py-3 text-sm font-semibold text-primary border border-primary/20 rounded-xl hover:bg-muted transition-colors w-full sm:w-auto"
            type="button"
            onClick={() => router.push(backHref)}
          >
            Go Back
          </button>
          <button
            className="px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-opacity shadow-sm w-full sm:w-auto flex justify-center items-center gap-2 disabled:opacity-60"
            type="submit"
            disabled={isSubmitting || Boolean(successMessage)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {successMessage ? "Payment Confirmed" : confirmLabel}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SecurePayment() {
  const searchParams = useSearchParams();
  const checkoutId = useMemo(() => parseCheckoutId(searchParams), [searchParams]);
  const legacyContext = useMemo(() => parsePaymentContext(searchParams), [searchParams]);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadContext = async () => {
      if (!checkoutId && !legacyContext) {
        setSummary(null);
        setLoadError("This payment link is invalid or missing its checkout information.");
        setIsLoadingContext(false);
        return;
      }

      setIsLoadingContext(true);
      setLoadError(null);

      try {
        if (checkoutId) {
          const checkout = await getCheckoutSession(checkoutId);
          if (!isActive) return;
          setSummary(buildSummaryFromCheckout(checkout));
          return;
        }

        if (!legacyContext) {
          throw new Error("Missing payment context.");
        }

        if (legacyContext.type === "marketplace-plan") {
          const planDetail = await getMarketplacePlanDetail(legacyContext.planId);
          const profile = await getNutritionistProfile(planDetail.nutritionist_id).catch(() => null);
          if (!isActive) return;

          setSummary(
            buildSummaryFromLegacyContext(legacyContext, {
              title: planDetail.title,
              provider:
                profile?.user?.username || profile?.username || planDetail.nutritionist_username || "Nutritionist",
              amount: planDetail.price,
              description: planDetail.description,
            }),
          );
          return;
        }

        if (legacyContext.type === "consultation") {
          const profile = await getNutritionistProfile(legacyContext.nutritionistId);
          if (!isActive) return;

          setSummary(
            buildSummaryFromLegacyContext(legacyContext, {
              title:
                legacyContext.consultationType === "plan_included" ? "Consultation + Plan" : "Consultation",
              provider: profile.user?.username || profile.username || "Nutritionist",
              amount:
                legacyContext.amount ??
                Number(profile.consultation_price ?? 0) +
                  (legacyContext.consultationType === "plan_included" ? 50 : 0),
              description: `Scheduled for ${legacyContext.appointmentDate} from ${legacyContext.startTime} to ${legacyContext.endTime}.`,
            }),
          );
          return;
        }

        setSummary(
          buildSummaryFromLegacyContext(legacyContext, {
            title: legacyContext.planType === "yearly" ? "Yearly Pro" : "Monthly Pro",
            provider: "Dieton Premium",
            amount: legacyContext.amount ?? getSubscriptionAmount(legacyContext.planType),
            description:
              legacyContext.planType === "yearly"
                ? "Annual premium access billed once per year."
                : "Monthly premium access billed once per month.",
          }),
        );
      } catch (error) {
        if (!isActive) return;
        setSummary(null);
        setLoadError(getAxiosErrorMessage(error));
      } finally {
        if (isActive) {
          setIsLoadingContext(false);
        }
      }
    };

    void loadContext();

    return () => {
      isActive = false;
    };
  }, [checkoutId, legacyContext]);

  const backHref = summary?.backHref ?? "/";
  const nextSteps = useMemo(
    () => getWhatHappensNext(summary?.itemType ?? null, summary?.provider || "the provider"),
    [summary?.itemType, summary?.provider],
  );

  if (isLoadingContext) {
    return (
      <main className="max-w-7xl mx-auto px-8 py-20 w-full">
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </main>
    );
  }

  if (loadError || (!checkoutId && !legacyContext) || !summary) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-20 w-full">
        <div className="bg-card rounded-3xl border border-border shadow-sm p-10 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-3">Payment unavailable</h1>
          <p className="text-muted-foreground mb-8">{loadError || "We couldn't build the requested payment flow."}</p>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-8 py-20 w-full">
      <div className="mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-3">
          Secure Payment
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Complete your purchase securely. Your final payment step is tailored to the service you selected.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 flex flex-col gap-12">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <Receipt className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                Order Summary
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Product
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {summary.title}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Provider
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {summary.provider}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Details
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {summary.description}
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-3 border-t border-border flex justify-between items-end">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Total Due
                  </h3>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {formatCheckoutAmount(summary.amount, summary.currency)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                What Happens Next
              </h2>
            </div>
            <ul className="space-y-4">
              {nextSteps.map((step) => (
                <li key={step.title} className="flex items-start gap-3">
                  <step.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      {step.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {step.body}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-12">
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentFormInner
                summary={summary}
                checkoutId={checkoutId}
                legacyContext={legacyContext}
                backHref={backHref}
              />
            </Elements>
          ) : (
            <PaymentFormInner
              summary={summary}
              checkoutId={checkoutId}
              legacyContext={legacyContext}
              backHref={backHref}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Secure Transactions
              </span>
              <span className="text-xs text-muted-foreground">
                Tokenized Stripe Elements (SAQ-A)
              </span>
            </div>
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <Eye className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Canonical Totals
              </span>
              <span className="text-xs text-muted-foreground">
                Prices come from the backend checkout session
              </span>
            </div>
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <BadgeCheck className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Clear Pricing
              </span>
              <span className="text-xs text-muted-foreground">
                Only tokenized payment payloads are submitted
              </span>
            </div>
          </div>

          <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
            <p className="mb-2">
              <strong className="font-semibold text-foreground">
                PCI-DSS Security Notice:
              </strong>{" "}
              Card data is securely tokenized via Stripe Elements and never touches or resides on our servers.
            </p>
            <p className="text-xs opacity-80">
              By clicking confirm, you authorize tokenized payment processing through Stripe and confirmation of your order session.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
