import axios from "axios";
import { getCookie, withAuthHeader } from "./auth";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1/",
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
        const response = await axios.post("http://127.0.0.1:8000/api/v1/auth/token/refresh/", {
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

/**
 * GET /marketplace/nutritionists/{id}/
 * Fetch a nutritionist's full profile
 */
export const getNutritionistProfile = async (id: string) => {
  const response = await api.get(`marketplace/nutritionists/${id}/`);
  return response.data;
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
  return response.data;
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
  is_free_from_plan: boolean;
}) => {
  const response = await api.post("client/consultations/book/", payload);
  return response.data;
};
