"use client";

export type PaymentFlowType = "marketplace-plan" | "consultation" | "subscription";
export type SubscriptionPlanType = "monthly" | "yearly";
export type ConsultationPaymentType = "advice_only" | "plan_included";

export const PUBLIC_SUBSCRIPTION_PRICES: Record<SubscriptionPlanType, number> = {
  monthly: 19,
  yearly: 190,
};

export type MarketplacePaymentContext = {
  type: "marketplace-plan";
  planId: number;
};

export type ConsultationPaymentContext = {
  type: "consultation";
  nutritionistId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationPaymentType;
};

export type SubscriptionPaymentContext = {
  type: "subscription";
  planType: SubscriptionPlanType;
};

export type PaymentContext =
  | MarketplacePaymentContext
  | ConsultationPaymentContext
  | SubscriptionPaymentContext;

export function formatPaymentAmount(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getSubscriptionAmount(planType: SubscriptionPlanType): number {
  return PUBLIC_SUBSCRIPTION_PRICES[planType];
}

export function generateTransactionNumber(prefix: PaymentFlowType): string {
  const normalizedPrefix = prefix.replace(/[^a-z]/gi, "").toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${normalizedPrefix}-${Date.now()}-${random}`;
}

export function buildPaymentUrl(context: PaymentContext): string {
  const params = new URLSearchParams();

  params.set("type", context.type);

  if (context.type === "marketplace-plan") {
    params.set("planId", String(context.planId));
  }

  if (context.type === "consultation") {
    params.set("nutritionistId", String(context.nutritionistId));
    params.set("appointmentDate", context.appointmentDate);
    params.set("startTime", context.startTime);
    params.set("endTime", context.endTime);
    params.set("consultationType", context.consultationType);
  }

  if (context.type === "subscription") {
    params.set("planType", context.planType);
  }

  return `/payment?${params.toString()}`;
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isSubscriptionPlanType(value: string | null): value is SubscriptionPlanType {
  return value === "monthly" || value === "yearly";
}

function isConsultationPaymentType(value: string | null): value is ConsultationPaymentType {
  return value === "advice_only" || value === "plan_included";
}

type SearchParamReader = {
  get(name: string): string | null;
};

export function parsePaymentContext(searchParams: SearchParamReader): PaymentContext | null {
  const type = searchParams.get("type");

  if (type === "marketplace-plan") {
    const planId = parsePositiveInteger(searchParams.get("planId"));
    if (!planId) return null;

    return {
      type,
      planId,
    };
  }

  if (type === "consultation") {
    const nutritionistId = parsePositiveInteger(searchParams.get("nutritionistId"));
    const appointmentDate = searchParams.get("appointmentDate");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const consultationType = searchParams.get("consultationType");

    if (
      !nutritionistId ||
      !appointmentDate ||
      !startTime ||
      !endTime ||
      !isConsultationPaymentType(consultationType)
    ) {
      return null;
    }

    return {
      type,
      nutritionistId,
      appointmentDate,
      startTime,
      endTime,
      consultationType,
    };
  }

  if (type === "subscription") {
    const planType = searchParams.get("planType");
    if (!isSubscriptionPlanType(planType)) return null;

    return {
      type,
      planType,
    };
  }

  return null;
}
