"use client";

export type CheckoutItemType = "MEAL_PLAN" | "CONSULTATION" | "SUBSCRIPTION";
export type SubscriptionPlanType = "monthly" | "yearly";
export type ConsultationPaymentType = "advice_only" | "plan_included";
export type LegacyPaymentFlowType = "marketplace-plan" | "consultation" | "subscription";

export const DEFAULT_SUBSCRIPTION_PRICES: Record<SubscriptionPlanType, number> = {
  monthly: 19,
  yearly: 190,
};

export type MarketplaceCheckoutContext = {
  itemType: "MEAL_PLAN";
  itemId: number;
};

export type ConsultationCheckoutContext = {
  itemType: "CONSULTATION";
  itemId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationPaymentType;
  userPlanId?: number;
  isFreeFromPlan?: boolean;
};

export type SubscriptionCheckoutContext = {
  itemType: "SUBSCRIPTION";
  itemId: SubscriptionPlanType;
  planType: SubscriptionPlanType;
};

export type CheckoutCreationContext =
  | MarketplaceCheckoutContext
  | ConsultationCheckoutContext
  | SubscriptionCheckoutContext;

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
  amount?: number;
  userPlanId?: number;
  isFreeFromPlan?: boolean;
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
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("admin_subscription_prices");
      if (stored) {
        const prices = JSON.parse(stored);
        if (prices && typeof prices[planType] === "number") {
          return prices[planType];
        }
      }
    } catch (e) {
      console.error("Failed to parse subscription prices from local storage", e);
    }
  }
  return DEFAULT_SUBSCRIPTION_PRICES[planType];
}

export function generateTransactionNumber(prefix: string): string {
  const normalizedPrefix = prefix.replace(/[^a-z]/gi, "").toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${normalizedPrefix}-${Date.now()}-${random}`;
}

export function getSubscriptionCheckoutItemId(planType: SubscriptionPlanType): 1 | 2 {
  return planType === "monthly" ? 1 : 2;
}

export function buildPaymentUrl(input: string | PaymentContext): string {
  const params = new URLSearchParams();

  if (typeof input === "string") {
    params.set("checkout_id", input);
    return `/payment?${params.toString()}`;
  }

  params.set("type", input.type);

  if (input.type === "marketplace-plan") {
    params.set("planId", String(input.planId));
  }

  if (input.type === "consultation") {
    params.set("nutritionistId", String(input.nutritionistId));
    params.set("appointmentDate", input.appointmentDate);
    params.set("startTime", input.startTime);
    params.set("endTime", input.endTime);
    params.set("consultationType", input.consultationType);
    if (input.amount) params.set("amount", String(input.amount));
    if (input.userPlanId) params.set("userPlanId", String(input.userPlanId));
    if (input.isFreeFromPlan) params.set("isFreeFromPlan", "true");
  }

  if (input.type === "subscription") {
    params.set("planType", input.planType);
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

export function parseCheckoutId(searchParams: SearchParamReader): string | null {
  const checkoutId = searchParams.get("checkout_id");
  return checkoutId && checkoutId.trim() ? checkoutId : null;
}

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
    const amount = searchParams.get("amount");
    const userPlanId = parsePositiveInteger(searchParams.get("userPlanId"));
    const isFreeFromPlan = searchParams.get("isFreeFromPlan") === "true";

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
      ...(amount && !Number.isNaN(Number(amount)) ? { amount: Number(amount) } : {}),
      ...(userPlanId ? { userPlanId } : {}),
      isFreeFromPlan,
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
