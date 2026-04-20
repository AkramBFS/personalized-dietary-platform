import api from "@/lib/api";

const useBackendMocks = process.env.NEXT_PUBLIC_USE_BACKEND_MOCKS !== "false";

interface ApiEnvelope<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}

export interface NutritionistProfile {
  nutritionist_id: number;
  bio: string;
  years_experience: number;
  consultation_price: number;
  language_ids: number[];
  profile_photo_url: string | null;
  specialization_name?: string;
  user?: {
    username?: string;
    email?: string;
  };
}

export interface ProfilePatchPayload {
  bio?: string;
  years_experience?: number;
  consultation_price?: number;
  language_ids?: number[];
  profile_photo?: File;
}

export interface AvailabilitySlotPayload {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface NutritionistHoliday {
  id: number;
  holiday_date: string;
}

export interface NutritionistSchedule {
  availability: AvailabilitySlotPayload[];
  holidays: NutritionistHoliday[];
}

export interface NutritionistConsultation {
  id: number;
  client_id: number;
  client_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "finished" | "cancelled" | "notified";
  consultation_type: "advice_only" | "plan_included" | "custom_plan_session";
  zoom_link: string | null;
}

export interface NutritionistPatientSummary {
  client_id: number;
  username: string;
  patient_type: string;
}

export interface PatientProgressSnapshot {
  current_weight: number;
  goal_weight: number;
  adherence_score: number;
}

export interface NutritionistPatientProgressPoint {
  day_label: string;
  intake_calories: number;
  target_calories: number;
  weight: number;
}

export interface NutritionistPatientProgressResponse {
  intake_vs_target: NutritionistPatientProgressPoint[];
}

export interface NutritionistPatientAssignedPlan {
  id: number;
  title: string;
  duration_days: number;
  current_day_index: number;
  progress_percent: number;
  status: "active" | "completed" | "paused";
  content_json?: DailyMealContent[];
}

export interface NutritionistPatientProfile {
  client_id: number;
  age: number;
  weight: number;
  height: number;
  bmi: number;
  bmr: number;
  health_history: string;
  goal_name: string;
  notes: string[];
  progress: PatientProgressSnapshot;
}

export interface CreatePatientNotePayload {
  note_content: string;
}

export type PlanType = "private-custom" | "public-predefined";
export type PlanStatus = "pending" | "approved" | "rejected" | "deleted";
export type PlanCategory = "predefined" | "personalized" | "seasonal";

export interface DailyMealContent {
  day_index: number;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  instructions: string;
}

export interface NutritionistPlan {
  id: number;
  title: string;
  description: string;
  plan_type: PlanType;
  category: PlanCategory;
  status: PlanStatus;
  price: number;
  duration_days: number;
  created_at: string;
  target_client_id?: number;
  content_json: DailyMealContent[];
}

export interface CreatePlanPayload {
  title: string;
  description: string;
  plan_type: PlanType;
  target_client_id?: number;
  price: number;
  duration_days: number;
  category: PlanCategory;
  content_json: DailyMealContent[];
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export interface NutritionistEarningsTransaction {
  transaction_number: string;
  total_paid: number;
  net_earnings: number;
  item_type: "plan" | "consultation_advice" | "consultation_custom";
  created_at: string;
}

export interface NutritionistEarningsSummary {
  total_gross: number;
  total_commission: number;
  total_net: number;
  transactions: NutritionistEarningsTransaction[];
}

const mockProfile: NutritionistProfile = {
  nutritionist_id: 44,
  bio: "Clinical nutritionist focused on weight management and hormonal health.",
  years_experience: 6,
  consultation_price: 45,
  language_ids: [1, 2],
  profile_photo_url: null,
  specialization_name: "Clinical Nutrition",
  user: {
    username: "Dr. Souki",
    email: "souki.nutrition@example.com",
  },
};

const mockSchedule: NutritionistSchedule = {
  availability: [
    { day_of_week: 0, start_time: "10:00", end_time: "15:00" },
    { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 2, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 4, start_time: "09:00", end_time: "14:00" },
  ],
  holidays: [{ id: 1, holiday_date: "2026-04-18" }],
};

const mockConsultations: NutritionistConsultation[] = [
  {
    id: 1,
    client_id: 101,
    client_name: "Alex Johnson",
    appointment_date: "2026-04-17",
    start_time: "10:00",
    end_time: "11:00",
    status: "scheduled",
    consultation_type: "custom_plan_session",
    zoom_link: null,
  },
  {
    id: 2,
    client_id: 102,
    client_name: "Sarah Smith",
    appointment_date: "2026-04-17",
    start_time: "14:00",
    end_time: "15:00",
    status: "notified",
    consultation_type: "plan_included",
    zoom_link: "https://zoom.us/j/12345678",
  },
];

const mockPatients: NutritionistPatientSummary[] = [
  { client_id: 101, username: "Alex Johnson", patient_type: "custom plan" },
  { client_id: 102, username: "Sarah Smith", patient_type: "free consultation" },
];

const mockPatientProfile: NutritionistPatientProfile = {
  client_id: 101,
  age: 29,
  weight: 85,
  height: 180,
  bmi: 26.2,
  bmr: 1812,
  health_history: "Mild lactose intolerance, no chronic medication.",
  goal_name: "Weight Loss",
  notes: ["Sleep quality is inconsistent.", "Responds well to high-protein breakfast."],
  progress: {
    current_weight: 85,
    goal_weight: 76,
    adherence_score: 74,
  },
};

const mockPatientProgress: NutritionistPatientProgressResponse = {
  intake_vs_target: [
    { day_label: "Sun", intake_calories: 1520, target_calories: 1800, weight: 85.4 },
    { day_label: "Mon", intake_calories: 1680, target_calories: 1800, weight: 85.1 },
    { day_label: "Tue", intake_calories: 1755, target_calories: 1800, weight: 84.9 },
    { day_label: "Wed", intake_calories: 1620, target_calories: 1800, weight: 84.8 },
    { day_label: "Thu", intake_calories: 1810, target_calories: 1800, weight: 84.7 },
    { day_label: "Fri", intake_calories: 1700, target_calories: 1800, weight: 84.5 },
    { day_label: "Sat", intake_calories: 1660, target_calories: 1800, weight: 84.4 },
  ],
};

const mockPatientPlans: NutritionistPatientAssignedPlan[] = [
  {
    id: 991,
    title: "Hormonal Balance 30-Day",
    duration_days: 30,
    current_day_index: 4,
    progress_percent: 16.7,
    status: "active",
    content_json: [
      {
        day_index: 0,
        breakfast: "Greek yogurt, oats, and berries",
        lunch: "Chicken quinoa bowl",
        dinner: "Salmon, sweet potato, and spinach",
        snacks: "Mixed nuts and one fruit",
        instructions: "Drink at least 2.5L water and avoid sugary drinks.",
      },
      {
        day_index: 4,
        breakfast: "Egg omelette with vegetables",
        lunch: "Lentil salad with grilled chicken",
        dinner: "Lean beef with roasted vegetables",
        snacks: "Hummus with cucumber slices",
        instructions: "Keep sodium moderate and split meals evenly.",
      },
    ],
  },
];

const mockPlans: NutritionistPlan[] = [
  {
    id: 11,
    title: "7-Day Ketosis Kickstart",
    description: "A beginner-friendly keto adaptation week.",
    plan_type: "public-predefined",
    category: "predefined",
    status: "approved",
    price: 19.99,
    duration_days: 7,
    created_at: "2026-03-12",
    content_json: [
      {
        day_index: 0,
        breakfast: "Egg omelette + avocado",
        lunch: "Grilled chicken salad",
        dinner: "Baked salmon + broccoli",
        snacks: "Nuts + yogurt",
        instructions: "Hydrate well and avoid sugary drinks.",
      },
    ],
  },
  {
    id: 12,
    title: "Seasonal Gut Reset",
    description: "Fiber-rich seasonal meal plan.",
    plan_type: "public-predefined",
    category: "seasonal",
    status: "pending",
    price: 24.99,
    duration_days: 14,
    created_at: "2026-04-10",
    content_json: [],
  },
];

const mockEarnings: NutritionistEarningsSummary = {
  total_gross: 9650,
  total_commission: 1447.5,
  total_net: 8202.5,
  transactions: [
    {
      transaction_number: "TX-89012",
      total_paid: 45,
      net_earnings: 38.25,
      item_type: "consultation_advice",
      created_at: "2026-04-12T10:23:00Z",
    },
    {
      transaction_number: "TX-89013",
      total_paid: 120,
      net_earnings: 102,
      item_type: "consultation_custom",
      created_at: "2026-04-11T15:15:00Z",
    },
  ],
};

function unwrapResponse<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

function hasNetworkError(error: unknown): boolean {
  return error instanceof Error;
}

export async function getNutritionistProfile(): Promise<NutritionistProfile> {
  if (useBackendMocks) return mockProfile;
  try {
    const response = await api.get<ApiEnvelope<NutritionistProfile> | NutritionistProfile>("/nutritionist/profile/");
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockProfile;
    throw error;
  }
}

export async function patchNutritionistProfile(payload: ProfilePatchPayload): Promise<NutritionistProfile> {
  if (useBackendMocks) {
    return { ...mockProfile, ...payload, profile_photo_url: payload.profile_photo ? URL.createObjectURL(payload.profile_photo) : mockProfile.profile_photo_url };
  }

  const formData = new FormData();
  if (payload.bio !== undefined) formData.append("bio", payload.bio);
  if (payload.years_experience !== undefined) formData.append("years_experience", String(payload.years_experience));
  if (payload.consultation_price !== undefined) formData.append("consultation_price", String(payload.consultation_price));
  if (payload.language_ids) {
    payload.language_ids.forEach((languageId) => formData.append("language_ids", String(languageId)));
  }
  if (payload.profile_photo) formData.append("profile_photo", payload.profile_photo);

  try {
    const response = await api.patch<ApiEnvelope<NutritionistProfile> | NutritionistProfile>("/nutritionist/profile/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) {
      return { ...mockProfile, ...payload, profile_photo_url: payload.profile_photo ? URL.createObjectURL(payload.profile_photo) : mockProfile.profile_photo_url };
    }
    throw error;
  }
}

export async function getNutritionistSchedule(): Promise<NutritionistSchedule> {
  if (useBackendMocks) return mockSchedule;
  try {
    const response = await api.get<ApiEnvelope<NutritionistSchedule> | NutritionistSchedule>("/nutritionist/schedule/");
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockSchedule;
    throw error;
  }
}

export async function putNutritionistAvailability(availability: AvailabilitySlotPayload[]): Promise<NutritionistSchedule> {
  if (useBackendMocks) return { ...mockSchedule, availability };
  try {
    await api.put("/nutritionist/schedule/availability/", { availability });
    return await getNutritionistSchedule();
  } catch (error) {
    if (hasNetworkError(error)) return { ...mockSchedule, availability };
    throw error;
  }
}

export async function addNutritionistHoliday(holiday_date: string): Promise<NutritionistHoliday> {
  if (useBackendMocks) return { id: Date.now(), holiday_date };
  try {
    const response = await api.post<ApiEnvelope<NutritionistHoliday> | NutritionistHoliday>("/nutritionist/schedule/holidays/", { holiday_date });
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return { id: Date.now(), holiday_date };
    throw error;
  }
}

export async function deleteNutritionistHoliday(holidayId: number): Promise<void> {
  if (useBackendMocks) return;
  try {
    await api.delete(`/nutritionist/schedule/holidays/${holidayId}/`);
  } catch (error) {
    if (hasNetworkError(error)) return;
    throw error;
  }
}

export async function getNutritionistConsultations(): Promise<NutritionistConsultation[]> {
  if (useBackendMocks) return mockConsultations;
  try {
    const response = await api.get<ApiEnvelope<NutritionistConsultation[]> | NutritionistConsultation[]>("/nutritionist/consultations/");
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockConsultations;
    throw error;
  }
}

export async function patchConsultationZoomLink(consultationId: number, zoom_link: string): Promise<void> {
  if (useBackendMocks) return;
  try {
    await api.patch(`/nutritionist/consultations/${consultationId}/zoom-link/`, { zoom_link });
  } catch (error) {
    if (hasNetworkError(error)) return;
    throw error;
  }
}

export async function getNutritionistPatients(): Promise<NutritionistPatientSummary[]> {
  if (useBackendMocks) return mockPatients;
  try {
    const response = await api.get<ApiEnvelope<NutritionistPatientSummary[]> | NutritionistPatientSummary[]>("/nutritionist/patients/");
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockPatients;
    throw error;
  }
}

export async function getNutritionistPatientProfile(clientId: number): Promise<NutritionistPatientProfile> {
  if (useBackendMocks) return { ...mockPatientProfile, client_id: clientId };
  try {
    const response = await api.get<ApiEnvelope<NutritionistPatientProfile> | NutritionistPatientProfile>(`/nutritionist/patients/${clientId}/`);
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return { ...mockPatientProfile, client_id: clientId };
    throw error;
  }
}

export async function addNutritionistPatientNote(clientId: number, payload: CreatePatientNotePayload): Promise<void> {
  if (useBackendMocks) return;
  try {
    await api.post(`/nutritionist/patients/${clientId}/notes/`, payload);
  } catch (error) {
    if (hasNetworkError(error)) return;
    throw error;
  }
}

export async function getNutritionistPatientProgress(clientId: number): Promise<NutritionistPatientProgressResponse> {
  if (useBackendMocks) return mockPatientProgress;
  try {
    const response = await api.get<ApiEnvelope<NutritionistPatientProgressResponse> | NutritionistPatientProgressResponse>(
      `/nutritionist/patients/${clientId}/progress/`
    );
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockPatientProgress;
    throw error;
  }
}

export async function getNutritionistPatientPlans(clientId: number): Promise<NutritionistPatientAssignedPlan[]> {
  if (useBackendMocks) return mockPatientPlans;
  try {
    const response = await api.get<ApiEnvelope<NutritionistPatientAssignedPlan[]> | NutritionistPatientAssignedPlan[]>(
      `/nutritionist/patients/${clientId}/plans/`
    );
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockPatientPlans;
    throw error;
  }
}

export async function getNutritionistPlans(): Promise<NutritionistPlan[]> {
  if (useBackendMocks) return mockPlans;
  try {
    const response = await api.get<ApiEnvelope<NutritionistPlan[]> | NutritionistPlan[]>("/nutritionist/plans/");
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockPlans;
    throw error;
  }
}

export async function createNutritionistPlan(payload: CreatePlanPayload): Promise<NutritionistPlan> {
  if (useBackendMocks) {
    return {
      id: Date.now(),
      status: payload.plan_type === "public-predefined" ? "pending" : "approved",
      created_at: new Date().toISOString(),
      ...payload,
    };
  }
  try {
    const response = await api.post<ApiEnvelope<NutritionistPlan> | NutritionistPlan>("/nutritionist/plans/", payload);
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) {
      return {
        id: Date.now(),
        status: payload.plan_type === "public-predefined" ? "pending" : "approved",
        created_at: new Date().toISOString(),
        ...payload,
      };
    }
    throw error;
  }
}

export async function updateNutritionistPlan(planId: number, payload: UpdatePlanPayload): Promise<void> {
  if (useBackendMocks) return;
  try {
    await api.patch(`/nutritionist/plans/${planId}/`, payload);
  } catch (error) {
    if (hasNetworkError(error)) return;
    throw error;
  }
}

export async function deleteNutritionistPlan(planId: number): Promise<void> {
  if (useBackendMocks) return;
  try {
    await api.delete(`/nutritionist/plans/${planId}/`);
  } catch (error) {
    if (hasNetworkError(error)) return;
    throw error;
  }
}

export async function getNutritionistEarnings(): Promise<NutritionistEarningsSummary> {
  if (useBackendMocks) return mockEarnings;
  try {
    const response = await api.get<ApiEnvelope<NutritionistEarningsSummary> | NutritionistEarningsSummary>("/nutritionist/earnings/");
    return unwrapResponse(response.data);
  } catch (error) {
    if (hasNetworkError(error)) return mockEarnings;
    throw error;
  }
}

