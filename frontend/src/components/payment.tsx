"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  Receipt,
  Info,
  CheckCircle,
  Bell,
  Calendar,
  Lock,
  CreditCard,
  Landmark,
  HelpCircle,
  ShieldCheck,
  Eye,
  BadgeCheck,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  bookConsultation,
  getMarketplacePlanDetail,
  getNutritionistProfile,
  purchaseClientSubscription,
  purchaseMarketplacePlan,
} from "@/lib/api";
import {
  formatPaymentAmount,
  generateTransactionNumber,
  getSubscriptionAmount,
  parsePaymentContext,
  PaymentContext,
} from "@/lib/payment";

type FormState = {
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  zip: string;
};

type SummaryState = {
  title: string;
  provider: string;
  amount: number;
  description: string;
};

const INITIAL_FORM_STATE: FormState = {
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  zip: "",
};

function getBackHref(context: PaymentContext | null): string {
  if (!context) return "/";
  if (context.type === "marketplace-plan") return "/marketplace";
  if (context.type === "consultation") {
    return `/consultations/schedule?id=${context.nutritionistId}`;
  }
  return "/subscription";
}

function getConsultationTypeLabel(type: "advice_only" | "plan_included"): string {
  return type === "plan_included" ? "Consultation + Plan" : "Consultation";
}

function normalizeCardNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 16);
}

function formatCardNumber(value: string): string {
  return normalizeCardNumber(value)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function normalizeExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateForm(form: FormState): string | null {
  if (!form.cardName.trim()) return "Cardholder name is required.";
  if (normalizeCardNumber(form.cardNumber).length < 12) return "Enter a valid card number.";
  if (!/^\d{2}\/\d{2}$/.test(form.expiry)) return "Use MM/YY for the expiration date.";
  if (!/^\d{3,4}$/.test(form.cvc)) return "Enter a valid CVC.";
  if (!form.zip.trim()) return "Billing zip or postal code is required.";
  return null;
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

function getWhatHappensNext(context: PaymentContext | null, provider: string) {
  if (!context) return [];

  if (context.type === "marketplace-plan") {
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

  if (context.type === "consultation") {
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

export default function SecurePayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = useMemo(() => parsePaymentContext(searchParams), [searchParams]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionNumber, setTransactionNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadContext = async () => {
      if (!context) {
        setSummary(null);
        setLoadError("This payment link is invalid or missing required details.");
        setIsLoadingContext(false);
        return;
      }

      setIsLoadingContext(true);
      setLoadError(null);
      setSubmitError(null);
      setSuccessMessage(null);
      setTransactionNumber(null);

      try {
        if (context.type === "marketplace-plan") {
          const planDetail = await getMarketplacePlanDetail(context.planId);
          const profile = await getNutritionistProfile(planDetail.nutritionist_id).catch(() => null);
          if (!isActive) return;

          setSummary({
            title: planDetail.title,
            provider: profile?.user?.username || profile?.username || planDetail.nutritionist_username,
            amount: planDetail.price,
            description: planDetail.description,
          });
          return;
        }

        if (context.type === "consultation") {
          const profile = await getNutritionistProfile(context.nutritionistId);
          if (!isActive) return;

          setSummary({
            title: getConsultationTypeLabel(context.consultationType),
            provider: profile.user?.username || profile.username || "Nutritionist",
            amount: context.amount ?? Number(profile.consultation_price ?? 0),
            description: `Scheduled for ${context.appointmentDate} from ${context.startTime} to ${context.endTime}.`,
          });
          return;
        }

        if (!isActive) return;
        const amount = getSubscriptionAmount(context.planType);
        setSummary({
          title: context.planType === "yearly" ? "Yearly Pro" : "Monthly Pro",
          provider: "Dieton Premium",
          amount,
          description:
            context.planType === "yearly"
              ? "Annual premium access billed once per year."
              : "Monthly premium access billed once per month.",
        });
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
  }, [context]);

  const backHref = getBackHref(context);
  const nextSteps = useMemo(
    () => getWhatHappensNext(context, summary?.provider || "the provider"),
    [context, summary?.provider],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!context || !summary || isSubmitting) return;

    const validationError = validateForm(form);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const generatedTransactionNumber = generateTransactionNumber(context.type);

    try {
      if (context.type === "marketplace-plan") {
        await purchaseMarketplacePlan(context.planId, {
          transaction_number: generatedTransactionNumber,
          amount_paid: summary.amount,
        });
        setSuccessMessage("Payment confirmed. Your marketplace plan is now attached to your account.");
      }

      if (context.type === "consultation") {
        await bookConsultation({
          nutritionist_id: String(context.nutritionistId),
          appointment_date: context.appointmentDate,
          start_time: context.startTime,
          end_time: context.endTime,
          consultation_type: context.consultationType,
          user_plan_id: context.userPlanId,
          is_free_from_plan: context.isFreeFromPlan || false,
          amount_paid: summary.amount,
          transaction_number: generatedTransactionNumber,
        });
        setSuccessMessage("Payment confirmed. Your consultation booking has been submitted successfully.");
      }

      if (context.type === "subscription") {
        await purchaseClientSubscription({
          plan_type: context.planType,
          amount_paid: summary.amount,
          transaction_number: generatedTransactionNumber,
        });
        setSuccessMessage("Payment confirmed. Your premium subscription is now active.");
      }

      setTransactionNumber(generatedTransactionNumber);
    } catch (error) {
      setSubmitError(getAxiosErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.push(backHref);
  };

  const confirmLabel = summary ? `Confirm Payment - ${formatPaymentAmount(summary.amount)}` : "Confirm Payment";

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

  if (loadError || !context || !summary) {
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
                <div className="text-3xl font-bold text-primary">{formatPaymentAmount(summary.amount)}</div>
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
                  htmlFor="cardName"
                >
                  Cardholder Name
                </label>
                <input
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                  id="cardName"
                  placeholder="Name as it appears on card"
                  type="text"
                  value={form.cardName}
                  onChange={(event) => setForm((current) => ({ ...current, cardName: event.target.value }))}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-foreground mb-2"
                  htmlFor="cardNumber"
                >
                  Card Number
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 pl-12 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    type="text"
                    value={form.cardNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cardNumber: formatCardNumber(event.target.value),
                      }))
                    }
                  />
                  <CreditCard className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-semibold text-foreground mb-2"
                    htmlFor="expiry"
                  >
                    Expiration Date
                  </label>
                  <input
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                    id="expiry"
                    placeholder="MM/YY"
                    type="text"
                    value={form.expiry}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expiry: normalizeExpiry(event.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className="flex justify-between items-center text-sm font-semibold text-foreground mb-2"
                    htmlFor="cvc"
                  >
                    CVC
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </label>
                  <input
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                    id="cvc"
                    placeholder="123"
                    type="text"
                    value={form.cvc}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cvc: event.target.value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-foreground mb-2"
                  htmlFor="zip"
                >
                  Billing Zip/Postal Code
                </label>
                <input
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                  id="zip"
                  placeholder="12345"
                  type="text"
                  value={form.zip}
                  onChange={(event) => setForm((current) => ({ ...current, zip: event.target.value }))}
                />
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
                  onClick={handleGoBack}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Secure Transactions
              </span>
              <span className="text-xs text-muted-foreground">
                Simulated encrypted checkout
              </span>
            </div>
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <Eye className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Canonical Totals
              </span>
              <span className="text-xs text-muted-foreground">
                Prices come from the current flow source
              </span>
            </div>
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <BadgeCheck className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Clear Pricing
              </span>
              <span className="text-xs text-muted-foreground">
                Only documented payment payloads are submitted
              </span>
            </div>
          </div>

          <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
            <p className="mb-2">
              <strong className="font-semibold text-foreground">
                Need to Know:
              </strong>{" "}
              This checkout uses a simulated card form for frontend payment handling, then submits only the documented backend payload for the selected flow.
            </p>
            <p className="text-xs opacity-80">
              By clicking the payment button, you confirm the selected purchase details and allow the application to submit the matching backend request for this service.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
