import type {
  NutritionistProfile,
  NutritionistSchedule,
  NutritionistConsultation,
  NutritionistPatientSummary,
  NutritionistPatientProfile,
  NutritionistPatientProgressResponse,
  NutritionistPatientAssignedPlan,
  NutritionistPlan,
  NutritionistEarningsSummary,
} from "./service";

export const mockProfile: NutritionistProfile = {
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

export const mockSchedule: NutritionistSchedule = {
  availability: [
    { day_of_week: 0, start_time: "10:00", end_time: "15:00" },
    { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 2, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
    { day_of_week: 4, start_time: "09:00", end_time: "14:00" },
  ],
  holidays: [{ id: 1, holiday_date: "2026-04-18" }],
};

export const mockConsultations: NutritionistConsultation[] = [
  {
    id: 1,
    client_id: 101,
    client_username: "Alex Johnson",
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
    client_username: "Sarah Smith",
    appointment_date: "2026-04-17",
    start_time: "14:00",
    end_time: "15:00",
    status: "notified",
    consultation_type: "plan_included",
    zoom_link: "https://zoom.us/j/12345678",
  },
];

export const mockPatients: NutritionistPatientSummary[] = [
  { id: 1, client_id: 101, username: "Alex Johnson", patient_type: "custom plan" },
  { id: 2, client_id: 102, username: "Sarah Smith", patient_type: "free consultation" },
];

export const mockPatientProfile: NutritionistPatientProfile = {
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

export const mockPatientProgress: NutritionistPatientProgressResponse = {
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

export const mockPatientPlans: NutritionistPatientAssignedPlan[] = [
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
        breakfast: { name: "Greek yogurt, oats, and berries", ingredients: [], calories: 0, notes: "" },
        lunch: { name: "Chicken quinoa bowl", ingredients: [], calories: 0, notes: "" },
        dinner: { name: "Salmon, sweet potato, and spinach", ingredients: [], calories: 0, notes: "" },
        snacks: { name: "Mixed nuts and one fruit", ingredients: [], calories: 0, notes: "" },
        instructions: "Drink at least 2.5L water and avoid sugary drinks.",
      },
      {
        day_index: 4,
        breakfast: { name: "Egg omelette with vegetables", ingredients: [], calories: 0, notes: "" },
        lunch: { name: "Lentil salad with grilled chicken", ingredients: [], calories: 0, notes: "" },
        dinner: { name: "Lean beef with roasted vegetables", ingredients: [], calories: 0, notes: "" },
        snacks: { name: "Hummus with cucumber slices", ingredients: [], calories: 0, notes: "" },
        instructions: "Keep sodium moderate and split meals evenly.",
      },
    ],
  },
];

export const mockPlans: NutritionistPlan[] = [
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
        breakfast: { name: "Egg omelette + avocado", ingredients: [], calories: 0, notes: "" },
        lunch: { name: "Grilled chicken salad", ingredients: [], calories: 0, notes: "" },
        dinner: { name: "Baked salmon + broccoli", ingredients: [], calories: 0, notes: "" },
        snacks: { name: "Nuts + yogurt", ingredients: [], calories: 0, notes: "" },
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

export const mockEarnings: NutritionistEarningsSummary = {
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
