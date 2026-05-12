import api, { ApiEnvelope, unwrapResponse } from "@/lib/api";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export interface ClientProfile {
  client_id: number;
  username: string;
  email: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  bmi?: number;
  bmr?: number;
  health_history?: string;
  profile_photo_url?: string | null;
  goal_id?: number | null;
  goal_name?: string;
  country_id?: number | null;
  country_name?: string;
  target_calories?: number | null;
  target_protein?: number | null;
  target_carbs?: number | null;
  target_fats?: number | null;
  activity_level?: string | null;
  diet?: string | null;
}

export interface ClientProfilePatchPayload {
  age?: number;
  weight?: number;
  height?: number;
  health_history?: string;
  goal_id?: number;
  country_id?: number;
  activity_level?: string | null;
  diet?: string | null;
  profile_photo?: File;
}

export interface ClientProgressTargetsPayload {
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
}

export interface ClientSubscription {
  id: number;
  plan_type?: "monthly" | "yearly" | string;
  amount_paid?: number;
  transaction_number?: string;
  start_date?: string;
  end_date?: string;
  status: "active" | "expired" | "cancelled" | string;
}

export interface ClientSubscriptionStatus {
  is_premium: boolean;
  subscription: ClientSubscription | null;
}

export interface CalorieLogIngredient {
  name?: string;
  label?: string;
  mass_grams?: number;
}

export interface CalorieLog {
  id: number;
  meal_type: MealType;
  entry_type: "ai_vision" | "manual_input" | string;
  user_final_log: CalorieLogIngredient[] | null;
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fats: number | null;
  status: "processing" | "pending_user_review" | "saved" | "failed" | "discarded" | string;
  logged_at: string;
}

export interface ManualIngredientPayload {
  name: string;
  mass_grams: number;
}

export interface ManualCalorieLogPayload {
  meal_type: MealType;
  ingredients: ManualIngredientPayload[];
}

export interface ManualCalorieLogResult {
  log_id: number;
  meal_type: MealType;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  daily_progress: ClientProgress;
}

export interface AIPrediction {
  label?: string;
  name?: string;
  class?: string;
  mass_grams?: number;
  mass?: number;
  calories?: number;
  confidence?: number;
}

export interface AINutritionPreview {
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fats?: number;
}

export interface AICalorieSubmitPayload {
  meal_type: MealType;
  image: File;
}

export interface AICalorieLog {
  log_id: number;
  status: "processing" | "pending_user_review" | "saved" | "failed" | string;
  meal_type: MealType;
  segmented_image_url?: string | null;
  predictions?: AIPrediction[];
  ai_raw_prediction?: { predictions?: AIPrediction[] } | AIPrediction[] | null;
  nutrition_preview?: AINutritionPreview;
  logged_at?: string;
}

export interface AICalorieConfirmPayload {
  meal_type: MealType;
  user_final_log: Array<{
    label: string;
    mass_grams: number;
  }>;
}

export interface AICalorieConfirmResult {
  log_id: number;
  status: "saved" | string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  daily_progress: ClientProgress;
}

export interface ClientProgress {
  id: number;
  log_date: string;
  total_calories_consumed: number;
  total_protein_consumed: number;
  total_carbs_consumed: number;
  total_fats_consumed: number;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fats: number | null;
  is_goal_achieved: boolean;
  notes?: string | null;
}

export interface ClientConsultation {
  id: number;
  nutritionist_id?: number;
  nutritionist_username?: string;
  nutritionist_name?: string;
  appointment_date: string;
  start_time?: string;
  end_time?: string;
  status: "scheduled" | "finished" | "cancelled" | string;
  consultation_type?: string;
  zoom_link?: string | null;
  created_at?: string;
}

export interface MealPlanDayMeal {
  name: string;
  notes: string;
  calories: number;
  ingredients: string[];
}

export interface MealPlanDayContent {
  day_index: number;
  breakfast: MealPlanDayMeal;
  lunch: MealPlanDayMeal;
  dinner: MealPlanDayMeal;
  snacks: MealPlanDayMeal; // single object
  instructions: string;
}

export interface ClientUserPlan {
  id: number;
  plan_id?: number;
  plan_title?: string;
  plan_cover?: string | null;
  plan_duration?: number;
  current_day_index?: number;
  progress_percent?: number;
  status: "active" | "completed" | string;
  free_consultations_used?: number;
  purchased_at?: string;
  plan?: {
    id?: number;
    title?: string;
    cover_image_url?: string | null;
    duration_days?: number;
  };
}

export interface CommunityPost {
  id: number;
  author_username: string;
  content: string;
  image_url?: string | null;
  status: "draft" | "published" | "removed" | "pending" | "approved" | "rejected" | string;
  is_approved: boolean;
  created_at: string;
  comments?: any[];
}

export interface ClientInvoice {
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
function unwrapList<T>(payload: ApiEnvelope<T[]> | T[] | { results?: T[] }): T[] {
  const data = unwrapResponse(payload as ApiEnvelope<T[]> | T[] | { results?: T[] });
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}

export function getIngredientName(ingredient: CalorieLogIngredient): string {
  return ingredient.name || ingredient.label || "Ingredient";
}

export function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getClientProfile(): Promise<ClientProfile> {
  const response = await api.get<ApiEnvelope<ClientProfile> | ClientProfile>("/client/profile/");
  return unwrapResponse(response.data);
}

export async function patchClientProfile(payload: ClientProfilePatchPayload): Promise<ClientProfile> {
  if (payload.profile_photo) {
    const formData = new FormData();
    if (payload.age !== undefined) formData.append("age", String(payload.age));
    if (payload.weight !== undefined) formData.append("weight", String(payload.weight));
    if (payload.height !== undefined) formData.append("height", String(payload.height));
    if (payload.health_history !== undefined) formData.append("health_history", payload.health_history);
    if (payload.goal_id !== undefined) formData.append("goal_id", String(payload.goal_id));
    if (payload.country_id !== undefined) formData.append("country_id", String(payload.country_id));
    if (payload.activity_level !== undefined && payload.activity_level !== null) formData.append("activity_level", payload.activity_level);
    if (payload.diet !== undefined && payload.diet !== null) formData.append("diet", payload.diet);
    formData.append("profile_photo", payload.profile_photo);

    const response = await api.patch<ApiEnvelope<ClientProfile> | ClientProfile>("/client/profile/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapResponse(response.data);
  }

  const jsonPayload: Omit<ClientProfilePatchPayload, "profile_photo"> = {};
  if (payload.age !== undefined) jsonPayload.age = payload.age;
  if (payload.weight !== undefined) jsonPayload.weight = payload.weight;
  if (payload.height !== undefined) jsonPayload.height = payload.height;
  if (payload.health_history !== undefined) jsonPayload.health_history = payload.health_history;
  if (payload.goal_id !== undefined) jsonPayload.goal_id = payload.goal_id;
  if (payload.country_id !== undefined) jsonPayload.country_id = payload.country_id;
  if (payload.activity_level !== undefined) jsonPayload.activity_level = payload.activity_level;
  if (payload.diet !== undefined) jsonPayload.diet = payload.diet;

  const response = await api.patch<ApiEnvelope<ClientProfile> | ClientProfile>("/client/profile/", jsonPayload);
  return unwrapResponse(response.data);
}

export async function getClientSubscriptionStatus(): Promise<ClientSubscriptionStatus> {
  const response = await api.get<ApiEnvelope<ClientSubscriptionStatus> | ClientSubscriptionStatus>(
    "/lookup/client/subscriptions/",
  );
  return unwrapResponse(response.data);
}

export async function getClientSubscriptions(): Promise<ClientSubscription[]> {
  const status = await getClientSubscriptionStatus();
  return status.subscription ? [status.subscription] : [];
}

export async function getCalorieLogs(date: string, entryType?: "ai_vision" | "manual_input"): Promise<CalorieLog[]> {
  const response = await api.get<ApiEnvelope<CalorieLog[]> | CalorieLog[]>("/client/calorie-tracker/logs/", {
    params: { date, ...(entryType ? { entry_type: entryType } : {}) },
  });
  return unwrapList(response.data);
}

export async function postManualCalorieLog(payload: ManualCalorieLogPayload): Promise<ManualCalorieLogResult> {
  const response = await api.post<ApiEnvelope<ManualCalorieLogResult> | ManualCalorieLogResult>(
    "/client/calorie-tracker/manual/",
    payload,
  );
  return unwrapResponse(response.data);
}

export async function postAICalorieLog(payload: AICalorieSubmitPayload): Promise<AICalorieLog> {
  const formData = new FormData();
  formData.append("meal_type", payload.meal_type);
  formData.append("image", payload.image);

  const response = await api.post<ApiEnvelope<AICalorieLog> | AICalorieLog>("/client/calorie-tracker/ai/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapResponse(response.data);
}

export async function getAICalorieLog(logId: number): Promise<AICalorieLog> {
  const response = await api.get<ApiEnvelope<AICalorieLog> | AICalorieLog>(`/client/calorie-tracker/ai/${logId}/`);
  return unwrapResponse(response.data);
}

export async function confirmAICalorieLog(
  logId: number,
  payload: AICalorieConfirmPayload,
): Promise<AICalorieConfirmResult> {
  const response = await api.patch<ApiEnvelope<AICalorieConfirmResult> | AICalorieConfirmResult>(
    `/client/calorie-tracker/ai/${logId}/confirm/`,
    payload,
  );
  return unwrapResponse(response.data);
}

export async function getClientProgress(startDate: string, endDate: string): Promise<ClientProgress[]> {
  const response = await api.get<ApiEnvelope<ClientProgress[]> | ClientProgress[]>("/client/progress/", {
    params: { start_date: startDate, end_date: endDate },
  });
  return unwrapList(response.data);
}

export async function patchClientProgressTargets(
  payload: ClientProgressTargetsPayload,
): Promise<ClientProgress> {
  const response = await api.patch<ApiEnvelope<ClientProgress> | ClientProgress>(
    "/client/progress/targets/",
    payload,
  );
  return unwrapResponse(response.data);
}

export async function getClientConsultations(): Promise<ClientConsultation[]> {
  const response = await api.get<ApiEnvelope<ClientConsultation[]> | ClientConsultation[]>("/client/consultations/");
  return unwrapList(response.data);
}

export async function getClientUserPlans(): Promise<ClientUserPlan[]> {
  const response = await api.get<ApiEnvelope<ClientUserPlan[]> | ClientUserPlan[]>("/client/user-plans/");
  return unwrapList(response.data);
}

export async function getMealPlanDayContent(userPlanId: number, dayIndex?: number): Promise<MealPlanDayContent> {
  const response = await api.get<ApiEnvelope<MealPlanDayContent>>(`/client/user-plans/${userPlanId}/content/`, {
    params: dayIndex !== undefined ? { day_index: dayIndex } : {},
  });
  return unwrapResponse(response.data);
}

export async function advanceMealPlanDay(userPlanId: number): Promise<{ day_index: number; status: string }> {
  const response = await api.patch<ApiEnvelope<{ day_index: number; status: string }>>(
    `/client/user-plans/${userPlanId}/advance/`,
  );
  return unwrapResponse(response.data);
}

export interface BookConsultationPayload {
  nutritionist_id: number;
  appointment_date: string;
  start_time?: string;
  consultation_type?: string;
}

export async function postBookConsultation(payload: BookConsultationPayload): Promise<ClientConsultation> {
  const response = await api.post<ApiEnvelope<ClientConsultation> | ClientConsultation>(
    "/client/consultations/book/",
    payload,
  );
  return unwrapResponse(response.data);
}

export interface ReviewPayload {
  rating: number;
  comment: string;
}

export async function postMealPlanReview(planId: number, payload: ReviewPayload): Promise<void> {
  await api.post(`/client/reviews/meal-plans/${planId}/`, payload);
}

export async function postConsultationReview(consultationId: number, payload: ReviewPayload): Promise<void> {
  await api.post(`/client/reviews/consultations/${consultationId}/`, payload);
}

export async function getNutritionistAvailability(nutritionistId: number, date: string): Promise<unknown> {
  const response = await api.get(`/marketplace/nutritionists/${nutritionistId}/availability/`, {
    params: { date },
  });
  return unwrapResponse(response.data);
}

export async function getCommunityPosts(page?: number): Promise<CommunityPost[]> {
  const response = await api.get<ApiEnvelope<CommunityPost[]> | CommunityPost[] | { results?: CommunityPost[] }>(
    "/posts/",
    { params: page ? { page } : undefined },
  );
  return unwrapList(response.data);
}

export interface CreatePostPayload {
  title?: string;
  content: string;
  tags?: string[];
}

export async function postCreateCommunityPost(payload: CreatePostPayload): Promise<CommunityPost> {
  const response = await api.post<ApiEnvelope<CommunityPost> | CommunityPost>("/client/posts/", payload);
  return unwrapResponse(response.data);
}

export async function getClientOwnPosts(page?: number): Promise<CommunityPost[]> {
  const response = await api.get<ApiEnvelope<CommunityPost[]> | CommunityPost[] | { results?: CommunityPost[] }>(
    "/client/posts/mine/",
    { params: page ? { page } : undefined },
  );
  return unwrapList(response.data);
}

export async function deleteCommunityPost(postId: number): Promise<void> {
  await api.delete(`/client/posts/${postId}/`);
}

export async function getClientInvoices(): Promise<ClientInvoice[]> {
  const response = await api.get<ApiEnvelope<ClientInvoice[]> | ClientInvoice[] | { results?: ClientInvoice[] }>("/client/invoices/");
  return unwrapList(response.data);
}

export async function getInvoiceDetail(id: number): Promise<ClientInvoice> {
  const response = await api.get<ApiEnvelope<ClientInvoice> | ClientInvoice>(`/client/invoices/${id}/`);
  console.log("Invoice detail response:", response.data);
  return unwrapResponse(response.data);
}
