import axios from "axios";
import { getCookie, withAuthHeader } from "./auth";

export const API_BASE_URL = "http://127.0.0.1:8000/api/v1/";

export interface ApiEnvelope<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}

export function unwrapResponse<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export function resolveApiUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;

  const apiUrl = new URL(API_BASE_URL);
  const origin = `${apiUrl.protocol}//${apiUrl.host}`;
  
  // Ensure we have /media/ prefix for relative paths if it's not already there
  let normalizedPath = url.replace(/^\/+/, "");
  if (!normalizedPath.startsWith("media/")) {
    normalizedPath = `media/${normalizedPath}`;
  }
  
  return new URL(normalizedPath, `${origin}/`).toString();
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to add access token
api.interceptors.request.use(withAuthHeader, (error) => Promise.reject(error));

// Response Interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getCookie("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call the refresh endpoint directly to avoid looping
        const response = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
          refresh: refreshToken
        });

        const newAccessToken = response.data.access;
        // Optionally update the client-side cookie if it's not httpOnly
        if (typeof document !== "undefined") {
          document.cookie = `access_token=${newAccessToken}; path=/; max-age=3600`;
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ============================================
// Marketplace / Nutritionist API Services
// ============================================

export interface MarketplacePlanIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface MarketplacePlanMeal {
  name: string;
  notes: string;
  calories: number;
  ingredients: MarketplacePlanIngredient[];
}

export interface MarketplacePlanDayContent {
  day_index: number;
  breakfast: MarketplacePlanMeal;
  lunch: MarketplacePlanMeal;
  dinner: MarketplacePlanMeal;
  snacks: MarketplacePlanMeal;
  instructions: string;
}

export interface MarketplacePlanListItem {
  id: number;
  title: string;
  description: string;
  plan_type: "public-predefined" | string;
  status: "approved" | string;
  category?: "seasonal" | "predefined" | "personalized" | string;
  price: number;
  duration_days: number;
  free_consultations_per_week: number;
  rating_avg: number;
  cover_image_url: string | null;
  nutritionist_id: number;
  nutritionist_username: string;
  specialization_name?: string;
  created_at: string;
}

export interface MarketplacePlanDetail extends MarketplacePlanListItem {
  content_json: MarketplacePlanDayContent[];
  country_name?: string;
}

export interface MarketplacePlanPurchasePayload {
  transaction_number: string;
  amount_paid: number;
}

export interface MarketplacePlanPurchaseResult {
  user_plan: {
    id: number;
    plan: number;
    plan_title: string;
    plan_cover: string | null;
    plan_duration: number;
    current_day_index: number;
    status: string;
    free_consultations_used: number;
    purchased_at: string;
  };
  transaction_number: string;
  net_earnings: number;
}

export interface MarketplacePlansPage {
  count: number;
  page: number;
  results: MarketplacePlanListItem[];
}

export interface MarketplacePlansParams {
  page?: number;
  page_size?: number;
  specialization_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: "rating_desc" | "price_asc" | "price_desc" | "newest";
}

export interface MarketplaceNutritionistProfile {
  nutritionist_id: number;
  username?: string;
  bio?: string;
  years_experience?: number;
  consultation_price?: number;
  profile_photo_url?: string | null;
  specialization_name?: string;
  country_name?: string;
  languages?: string[];
  rating?: number;
  user?: {
    username?: string;
    email?: string;
  };
}

export interface SubscriptionPurchasePayload {
  plan_type: "monthly" | "yearly";
  amount_paid: number;
  transaction_number: string;
}

export function slugifyPlanTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildMarketplacePlanHref(plan: Pick<MarketplacePlanListItem, "id" | "title">): string {
  const slug = slugifyPlanTitle(plan.title);
  return `/marketplace/${plan.id}${slug ? `-${slug}` : ""}`;
}

export function parseMarketplacePlanIdFromSlug(slug: string): number | null {
  const match = slug.match(/^(\d+)(?:-|$)/);
  if (!match) return null;

  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * GET /marketplace/nutritionists/{id}/
 * Fetch a nutritionist's full profile
 */
export const getNutritionistProfile = async (id: string | number): Promise<MarketplaceNutritionistProfile> => {
  const response = await api.get(`marketplace/nutritionists/${id}/`);
  return unwrapResponse(response.data);
};

/**
 * GET /marketplace/nutritionists/{id}/availability/
 * Fetch available time slots for a specific date
 * @param id - Nutritionist ID
 * @param date - Date in YYYY-MM-DD format
 */
export const getNutritionistAvailability = async (id: string, date: string) => {
  const response = await api.get(`marketplace/nutritionists/${id}/availability/`, {
    params: { date }
  });
  return unwrapResponse(response.data);
};

/**
 * POST /client/consultations/book/
 * Book a consultation session
 */
export const bookConsultation = async (payload: {
  nutritionist_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  consultation_type: "advice_only" | "plan_included";
  user_plan_id?: number;
  is_free_from_plan: boolean;
}) => {
  const response = await api.post("client/consultations/book/", payload);
  return unwrapResponse(response.data);
};

// ============================================
// Nutritionist Directory (Marketplace List)
// ============================================

/**
 * Matches the exact shape returned by GET /marketplace/nutritionists/
 */
export interface NutritionistListItem {
  nutritionist_id: number;
  username: string;
  profile_photo_url: string | null;
  bio: string;
  years_experience: number;
  consultation_price: number;
  specialization_name: string;
  country_name: string;
  languages: string[];
  rating: number;
}

/**
 * GET /marketplace/nutritionists/
 * Fetch list of approved nutritionists for the public directory.
 */
export const getNutritionists = async (params?: {
  specialization_id?: number;
  language_id?: number;
  country_id?: number;
  sort?: string;
}) => {
  const response = await api.get("marketplace/nutritionists/", { params });
  return unwrapResponse(response.data);
};

/**
 * GET /marketplace/plans/
 * Fetch public marketplace plans with pagination and server-side filters.
 */
export const getMarketplacePlans = async (params?: MarketplacePlansParams): Promise<MarketplacePlansPage> => {
  const response = await api.get<ApiEnvelope<MarketplacePlansPage> | MarketplacePlansPage>("marketplace/plans/", {
    params,
  });
  return unwrapResponse(response.data);
};

/**
 * GET /marketplace/plans/{id}/
 * Fetch a single public marketplace plan detail.
 */
export const getMarketplacePlanDetail = async (id: number): Promise<MarketplacePlanDetail> => {
  const response = await api.get<ApiEnvelope<MarketplacePlanDetail> | MarketplacePlanDetail>(`marketplace/plans/${id}/`);
  return unwrapResponse(response.data);
};

/**
 * POST /marketplace/plans/{id}/purchase/
 * Purchase a public marketplace plan.
 */
export const purchaseMarketplacePlan = async (
  id: number,
  payload: MarketplacePlanPurchasePayload,
): Promise<MarketplacePlanPurchaseResult> => {
  const response = await api.post<
    ApiEnvelope<MarketplacePlanPurchaseResult> | MarketplacePlanPurchaseResult
  >(`marketplace/plans/${id}/purchase/`, payload);
  return unwrapResponse(response.data);
};

/**
 * POST /client/subscriptions/purchase/
 * Purchase a premium subscription using a simulated payment payload.
 */
export const purchaseClientSubscription = async (
  payload: SubscriptionPurchasePayload,
): Promise<{ status?: string; message?: string; subscription?: unknown }> => {
  const response = await api.post<
    ApiEnvelope<{ status?: string; message?: string; subscription?: unknown }> | {
      status?: string;
      message?: string;
      subscription?: unknown;
    }
  >("/lookup/client/subscriptions/purchase/", payload);
  return unwrapResponse(response.data);
};

// ============================================
// Nutritionist Invoices API
// ============================================

export interface NutritionistInvoice {
  id: number;
  transaction_number: string;
  total_paid: number;
  item_type: string;
  created_at: string;
  // Change these to match the API response you logged
  client_username: string; 
  nutritionist_username: string;
  net_earnings?: number;
  commission_rate?: number;
}

/**
 * GET /nutritionist/invoices/
 * List nutritionist's invoices
 */
export const getNutritionistInvoices = async (): Promise<NutritionistInvoice[]> => {
  const response = await api.get("nutritionist/invoices/");
  return unwrapResponse(response.data);
};

/**
 * GET /invoices/{id}/
 * Fetch full invoice details (shared with client if endpoint is same)
 * Note: If nutritionist uses a different endpoint, change it here.
 * Based on the request, nutritionist might use the same detailed view as client.
 */
export const getInvoiceDetail = async (id: number): Promise<NutritionistInvoice> => {
  const response = await api.get(`client/invoices/${id}/`);
  return unwrapResponse(response.data);
};
