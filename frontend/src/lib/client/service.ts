import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientProfile {
  client_id: number;
  user?: {
    username?: string;
    email?: string;
  };
  age?: number;
  weight: number;
  height: number;
  gender?: string;
  bmi: number;
  bmr: number;
  goal_name?: string;
  health_history?: string;
}

export interface ClientSubscription {
  id: number;
  status: "active" | "expired" | "cancelled";
  is_premium: boolean;
  end_date?: string;
  plan_type?: string;
}

export interface CalorieLog {
  id: number;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_items: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface ClientProgress {
  date: string;
  intake_calories: number;
  target_calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  weight?: number;
}

export interface ClientConsultation {
  id: number;
  nutritionist_id?: number;
  nutritionist_name?: string;
  appointment_date: string;
  start_time?: string;
  end_time?: string;
  status: "scheduled" | "finished" | "cancelled";
  consultation_type?: string;
  zoom_link?: string | null;
  created_at?: string;
}

export interface CommunityPost {
  id: number;
  title: string;
  content?: string;
  author?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Profile
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientProfile(): Promise<ClientProfile> {
  const response = await api.get("/client/profile/");
  return response.data;
}

export async function patchClientProfile(payload: Partial<ClientProfile>): Promise<ClientProfile> {
  const response = await api.patch("/client/profile/", payload);
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscriptions
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientSubscriptions(): Promise<ClientSubscription[]> {
  const response = await api.get("/client/subscriptions/");
  const data = response.data;
  return Array.isArray(data) ? data : data.results || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Calorie Tracker - Manual
// ─────────────────────────────────────────────────────────────────────────────

export async function getCalorieLogs(date: string): Promise<CalorieLog[]> {
  const response = await api.get("/client/calorie-tracker/logs/", {
    params: { date },
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.results || [];
}

export interface ManualCalorieLogPayload {
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_items: string;
}

export async function postManualCalorieLog(payload: ManualCalorieLogPayload): Promise<CalorieLog> {
  const response = await api.post("/client/calorie-tracker/manual/", payload);
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calorie Tracker - AI (Premium)
// ─────────────────────────────────────────────────────────────────────────────

export interface AICalorieLogPayload {
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  image: File;
}

export interface AICalorieLog {
  id: number;
  date: string;
  meal_type: string;
  status: "pending_processing" | "pending_user_review" | "confirmed" | "rejected";
  segmented_image_url?: string;
  detected_foods?: Array<{
    name: string;
    mass: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  created_at: string;
}

export async function postAICalorieLog(payload: AICalorieLogPayload): Promise<AICalorieLog> {
  const formData = new FormData();
  formData.append("date", payload.date);
  formData.append("meal_type", payload.meal_type);
  formData.append("image", payload.image);

  const response = await api.post("/client/calorie-tracker/ai/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getAICalorieLog(logId: number): Promise<AICalorieLog> {
  const response = await api.get(`/client/calorie-tracker/ai/${logId}/`);
  return response.data;
}

export async function confirmAICalorieLog(logId: number): Promise<void> {
  await api.patch(`/client/calorie-tracker/ai/${logId}/confirm/`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress (Daily summary)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressResponse {
  summary: ClientProgress[];
}

export async function getClientProgress(startDate: string, endDate: string): Promise<ClientProgress[]> {
  const response = await api.get("/client/progress/", {
    params: { start_date: startDate, end_date: endDate },
  });
  const data = response.data;
  if (data.summary) return data.summary;
  return Array.isArray(data) ? data : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Consultations
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientConsultations(): Promise<ClientConsultation[]> {
  const response = await api.get("/client/consultations/");
  const data = response.data;
  return Array.isArray(data) ? data : data.results || [];
}

export interface BookConsultationPayload {
  nutritionist_id: number;
  appointment_date: string;
  start_time?: string;
  consultation_type?: string;
}

export async function postBookConsultation(payload: BookConsultationPayload): Promise<ClientConsultation> {
  const response = await api.post("/client/consultations/book/", payload);
  return response.data;
}

export async function getNutritionistAvailability(nutritionistId: number, date: string): Promise<any> {
  const response = await api.get(`/marketplace/nutritionists/${nutritionistId}/availability/`, {
    params: { date },
  });
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Community Posts
// ─────────────────────────────────────────────────────────────────────────────

export async function getCommunityPosts(page?: number): Promise<CommunityPost[]> {
  const response = await api.get("/posts/", {
    params: page ? { page } : undefined,
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.results || [];
}

export interface CreatePostPayload {
  title: string;
  content: string;
  tags?: string[];
}

export async function postCreateCommunityPost(payload: CreatePostPayload): Promise<CommunityPost> {
  const response = await api.post("/client/posts/", payload);
  return response.data;
}

export async function getClientOwnPosts(page?: number): Promise<CommunityPost[]> {
  const response = await api.get("/client/posts/mine/", {
    params: page ? { page } : undefined,
  });
  const data = response.data;
  return Array.isArray(data) ? data : data.results || [];
}

export async function deleteClientPost(postId: number): Promise<void> {
  await api.delete(`/client/posts/${postId}/`);
}
