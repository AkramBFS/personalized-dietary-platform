Relevant file 1:
registration-flow.tsx:
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { stepSchemas } from "@/lib/constants";
import ProgressBar from "../ui/ProgressBar";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  bootstrapLookups,
  getCountries,
  getGoals,
  getLanguages,
  getActivityLevels,
  getDiets,
  LookupItem,
} from "@/lib/lookups";

const StepCountry = dynamic(() => import("../forms/StepCountrySelect"));
const StepGoal = dynamic(() => import("../forms/StepGoal"));
const StepActivity = dynamic(() => import("../forms/StepActivity"));
const StepDiet = dynamic(() => import("../forms/StepDiet"));
const StepAgeWeight = dynamic(() => import("../forms/StepAgeWeight"));
const StepHeight = dynamic(() => import("../forms/StepHeight"));
const StepBMI = dynamic(() => import("../forms/StepBMI"));
const StepMedical = dynamic(() => import("../forms/StepMedicalHistory"));
const StepSignUp = dynamic(() => import("../forms/StepSignUp"));
const StepReview = dynamic(() => import("../forms/StepReview"));

export default function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [countries, setCountries] = useState<LookupItem[]>([]);
  const [goals, setGoals] = useState<LookupItem[]>([]);
  const [languages, setLanguages] = useState<LookupItem[]>([]);
  const [activityLevels, setActivityLevels] = useState<LookupItem[]>([]);
  const [diets, setDiets] = useState<LookupItem[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(true);

  const router = useRouter();

  const [formData, setFormData] = useState({
    country: "",
    language: "",
    goal: "",
    goalCustom: "",
    activityLevel: "",
    diet: "",
    age: 25,
    weight: 70,
    height: 170,
    gender: "",
    medicalConditions: [] as string[],
    medicalConditionsCustom: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreedToTerms: false,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const cardVariants: Variants = {
    initial: (step: number) => {
      // Step 10: Simple fade in
      if (step === 10) return { opacity: 0, y: 10 };

      // Group 1 (Steps 3, 6, 9): Fade in while going from small to big
      if ([3, 6, 9].includes(step)) return { scale: 0.95, opacity: 0, x: 0 };

      // Group 2 (Steps 2, 5, 8): Fade in while sliding in from the left
      if ([2, 5, 8].includes(step)) return { x: -40, opacity: 0 };

      // Default (Steps 1, 4, 7): Fade in while sliding in from the right
      return { x: 40, opacity: 0 };
    },
    animate: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1], // Elegant ease-out curve
      },
    },
    exit: (step: number) => {
      if (step === 10) return { opacity: 0 };
      if ([3, 6, 9].includes(step)) return { scale: 1.05, opacity: 0 };
      if ([2, 5, 8].includes(step)) return { x: 40, opacity: 0 };
      return { x: -40, opacity: 0 };
    },
  };

  useEffect(() => {
    const loadLookups = async () => {
      try {
        await bootstrapLookups();
        setCountries(getCountries());
        setGoals(getGoals());
        setLanguages(getLanguages());
        setActivityLevels(getActivityLevels());
        setDiets(getDiets());
      } catch (error) {
        console.error("Failed to fetch lookup data", error);
      } finally {
        setLoadingLookup(false);
      }
    };
    loadLookups();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  const isStepValid = useMemo(() => {
    const schema = stepSchemas[currentStep - 1];
    return schema?.safeParse(formData).success ?? false;
  }, [currentStep, formData]);

  const healthMetrics = useMemo(() => {
    const { weight, height, age, gender } = formData;
    if (!weight || !height || !age || !gender) return null;

    const bmi = weight / (height / 100) ** 2;

    // Mifflin-St Jeor Formula
    const bmr =
      10 * weight + 6.25 * height - 5 * age + (gender === "male" ? 5 : -161);

    return { bmi: bmi.toFixed(1), bmr: Math.round(bmr) };
  }, [formData.weight, formData.height, formData.age, formData.gender]);

  //lock check + lock set for next and back
  const nextStep = () => {
    if (currentStep < 10 && isStepValid && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    if (isAnimating || isPending || loadingLookup) return;
    setIsAnimating(true);
    startTransition(async () => {
      try {
        // Map form data to API payload with case-insensitive and trim-safe matching
        const countryId = countries.find(
          (c) =>
            (c.name || "").toLowerCase().trim() ===
            (formData.country || "").toLowerCase().trim(),
        )?.id;
        const goalId = goals.find(
          (g) =>
            (g.name || "").toLowerCase().trim() ===
            (formData.goal || "").toLowerCase().trim(),
        )?.id;
        const activityId = activityLevels.find((a) => {
          const activityValue = (a.value ?? a.name ?? a.label ?? "")
            .toLowerCase()
            .trim();
          return (
            activityValue ===
            (formData.activityLevel || "").toLowerCase().trim()
          );
        })?.value;
        const dietId = diets.find(
          (d) =>
            (d.label || "").toLowerCase().trim() ===
            (formData.diet || "").toLowerCase().trim(),
        )?.value;

        if (!countryId || !goalId || !activityId || !dietId) {
          console.error("Lookup Mapping Debug:", {
            countryId,
            goalId,
            activityId,
            dietId,
            formDataCountry: formData.country,
            formDataGoal: formData.goal,
            formDataActivityLevel: formData.activityLevel,
            formDataDiet: formData.diet,
            availableCountries: countries.map((c) => c.name),
            availableGoals: goals.map((g) => g.name),
            availableActivityLevels: activityLevels.map(
              (a) => a.value ?? a.name ?? a.label,
            ),
            availableDiets: diets.map((d) => d.label),
          });
          throw new Error(
            "Please ensure all fields (Country, Goal, Activity Level, Diet) are selected correctly.",
          );
        }

        const healthHistory = (formData.medicalConditions as string[])
          .filter((cond) => cond !== "None")
          .concat(
            formData.medicalConditionsCustom
              ? [formData.medicalConditionsCustom]
              : [],
          )
          .join(", ");

        const payload = new FormData();
        payload.append("username", formData.email); // Use email as username
        payload.append("email", formData.email);
        payload.append("password", formData.password);
        payload.append("age", formData.age.toString());
        payload.append("weight", formData.weight.toString());
        payload.append("height", formData.height.toString());
        payload.append("gender", formData.gender);
        payload.append("country_id", countryId.toString());
        payload.append("goal_id", goalId.toString());
        payload.append("activity_level", activityId);
        payload.append("diet", dietId);
        if (healthHistory) {
          payload.append("health_history", healthHistory);
        }

        await api.post("/auth/register/client/", payload, {
          headers: {
            "Content-Type": undefined,
          },
        });
        alert("Registration Successful! Please log in.");
        router.push("/login");
      } catch (err: any) {
        console.error("Registration failed", err);
        if (err.response?.data?.message) {
          alert(err.response.data.message);
        } else {
          alert("Error submitting form");
        }
      } finally {
        setIsAnimating(false);
      }
    });
  };

  const renderStep = () => {
    const props = { formData, setFormData };
    switch (currentStep) {
      case 1:
        return (
          <StepCountry {...props} countries={countries} languages={languages} />
        );
      case 2:
        return <StepGoal {...props} goals={goals} />;
      case 3:
        return <StepActivity {...props} activityLevels={activityLevels} />;
      case 4:
        return <StepDiet {...props} diets={diets} />;
      case 5:
        return <StepAgeWeight {...props} />;
      case 6:
        return <StepHeight {...props} />;
      case 7:
        return <StepBMI {...props} metrics={healthMetrics} />;
      case 8:
        return <StepMedical {...props} />;
      case 9:
        return <StepSignUp {...props} />;
      case 10:
        return <StepReview {...props} />;
      default:
        return null;
    }
  };
  console.log(formData);
  return (
    <main className="relative h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-background">
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-full bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors"
          title="Back to Home"
        >
          <Home className="w-5 h-5 text-foreground" />
        </Link>
        <div className="p-1 rounded-full bg-card/50 backdrop-blur-md border border-border">
          <ThemeToggle />
        </div>
      </div>

      <AnimatePresence mode="popLayout" custom={currentStep}>
        <motion.div
          key={currentStep}
          custom={currentStep}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          // ensure the lock is active for the full duration of the spring
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
          className={`relative z-10 w-full max-w-xl h-[calc(100vh-2rem)] max-h-[850px] 
            absolute inset-0 flex flex-col overflow-hidden transition-colors duration-500
            ${isAnimating ? "pointer-events-none" : ""}`}
        >
          <div className="p-6 pb-0">
            <ProgressBar step={currentStep} total={10} />
          </div>

          <div
            ref={scrollContainerRef}
            className="relative mt-4 flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 custom-scrollbar"
          >
            {renderStep()}
          </div>

          <div className="p-6 pt-4 mt-auto">
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || isAnimating}
                className="px-6 py-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Back
              </button>

              {currentStep < 10 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid || isAnimating}
                  className="px-8 py-2 bg-button-primary text-button-primary-foreground font-semibold rounded-lg 
    transition-all duration-300 
    hover:brightness-105 hover:shadow-[0_0_20px_rgba(110,231,183,0.6)] 
    hover:-translate-y-0.5
    active:scale-95 
    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !isStepValid || isAnimating}
                  className="px-8 py-2 bg-button-primary text-button-primary-foreground rounded-lg disabled:opacity-50 
                    transition-all hover:brightness-105 shadow-md"
                >
                  {isPending ? "Submitting..." : "Complete Setup"}
                </button>
              )}
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already onboard?{" "}
              <Link
                href="/login"
                className="text-brand hover:text-brand/80 font-semibold underline underline-offset-4"
              >
                Sign in!
              </Link>
            </div>

            <div className="mt-2 text-center text-sm text-muted-foreground">
              Are you a certified nutritionist?{" "}
              <Link
                href="/register/nutritionist"
                className="text-brand hover:text-brand/80 font-semibold underline underline-offset-4"
              >
                Get on board!
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

Relevant file 2:
api.ts:
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

Relevant file 3:

auth.ts:
import { InternalAxiosRequestConfig } from "axios";

// Helper strictly for extracting cookies on the client side
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

// Interceptor utility injected into API definition
export function withAuthHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getCookie("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

export function setAccessToken(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `access_token=${token}; path=/; max-age=3600`;
  }
}

export function setRefreshToken(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `refresh_token=${token}; path=/; max-age=604800`; // 7 days
  }
}

Relevant file 4:

lookups.ts:
import api from "@/lib/api";

export interface LookupItem {
  id: number;
  name?: string;
  value?: string;
  label?: string;
  description?: string;
}

let lookupCache: {
  countries?: LookupItem[];
  goals?: LookupItem[];
  specializations?: LookupItem[];
  languages?: LookupItem[];
  activityLevels?: LookupItem[];
  diets?: LookupItem[];
} = {};

let bootstrapPromise: Promise<void> | null = null;

/**
 * Bootstrap lookup data once per app load.
 * Call this from the root layout or before rendering forms.
 * Caches results globally to avoid re-fetching.
 */
export async function bootstrapLookups(): Promise<void> {
  // If already bootstrapped, don't refetch
  if (Object.keys(lookupCache).length > 0) {
    return;
  }

  // If already in progress, wait for it to complete
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const [countriesRes, goalsRes, specializationsRes, languagesRes, activityRes, dietsRes] = await Promise.all([
        api.get("/lookup/countries/").catch(() => ({ data: [] })),
        api.get("/lookup/goals/").catch(() => ({ data: [] })),
        api.get("/lookup/specializations/").catch(() => ({ data: [] })),
        api.get("/lookup/languages/").catch(() => ({ data: [] })),
        api.get("/lookup/activity-levels/").catch(() => ({ data: [] })),
        api.get("/lookup/diets/").catch(() => ({ data: [] })),
      ]);

      const extractData = (res: any) => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.results)) return res.data.results;
        if (res.data && Array.isArray(res.data.data)) return res.data.data;
        return [];
      };

      lookupCache = {
        countries: extractData(countriesRes),
        goals: extractData(goalsRes),
        specializations: extractData(specializationsRes),
        languages: extractData(languagesRes),
        activityLevels: extractData(activityRes),
        diets: extractData(dietsRes),
      };
    } catch (err) {
      console.error("Failed to bootstrap lookup data", err);
      // Continue with empty lookups rather than blocking the app
      lookupCache = {
        countries: [],
        goals: [],
        specializations: [],
        languages: [],
        activityLevels: [],
        diets: [],
      };
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

/**
 * Get cached countries list. Call bootstrapLookups() first.
 */
export function getCountries(): LookupItem[] {
  return lookupCache.countries || [];
}

/**
 * Get cached goals list. Call bootstrapLookups() first.
 */
export function getGoals(): LookupItem[] {
  return lookupCache.goals || [];
}

/**
 * Get cached specializations list. Call bootstrapLookups() first.
 */
export function getSpecializations(): LookupItem[] {
  return lookupCache.specializations || [];
}

/**
 * Get cached languages list. Call bootstrapLookups() first.
 */
export function getLanguages(): LookupItem[] {
  return lookupCache.languages || [];
}

/**
 * Get cached activity levels list. Call bootstrapLookups() first.
 */
export function getActivityLevels(): LookupItem[] {
  return lookupCache.activityLevels || [];
}

/**
 * Get cached diets list. Call bootstrapLookups() first.
 */
export function getDiets(): LookupItem[] {
  return lookupCache.diets || [];
}

/**
 * Clear the lookup cache (useful for testing or forcing a refresh).
 */
export function clearLookupCache(): void {
  lookupCache = {};
  bootstrapPromise = null;
}

Relevant file 5:

constants.ts:
import { z } from "zod";

export const stepSchemas = [
  z.object({
    country: z.string().min(1, "Please select a country"),
    language: z.string().min(1, "Please select a language")
  }), // Step 1
  z.object({
    goal: z.string().min(1, "Required"),
    goalCustom: z.string().optional(),
  }).refine((data) => {
    if (data.goal === "Other") {
      return data.goalCustom && data.goalCustom.trim().length > 0;
    }
    return true;
  }, {
    message: "Please describe your custom goal",
    path: ["goalCustom"], // This points the error to the custom input field
  }),    // Step 2
  z.object({ activityLevel: z.string().min(1) }),       // Step 3
  z.object({ diet: z.string().min(1) }),                // Step 4
  z.object({
    age: z.number().min(16).max(100),
    weight: z.number().min(30).max(300),
    gender: z.enum(["male", "female"], {
      message: "Please select your gender",
    }),
  }),                                                 // Step 5
  z.object({ height: z.number().min(120).max(250) }),   // Step 6
  z.object({
    medicalConditions: z
      .array(z.string())
      .min(1, "Please select at least one option (or 'None')"),
    medicalConditionsCustom: z.string().optional(),
  }).refine((data) => {
    if (data.medicalConditions.includes("Other")) {
      return (
        data.medicalConditionsCustom &&
        data.medicalConditionsCustom.trim().length > 0
      );
    }
    return true;
  }, {
    message: "Please specify your medical condition",
    path: ["medicalConditionsCustom"],
  }), // Step 8

  z.object({
    firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }), // Step 9
  z.object({ agreedToTerms: z.literal(true) }),         // Step 10
];


export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const nutritionistRegistrationSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  country_id: z.coerce
    .number()
    .int("Country ID must be an integer")
    .positive("Country ID is required"),
  specialization_id: z.coerce
    .number()
    .int("Specialization ID must be an integer")
    .positive("Specialization ID is required"),
  years_experience: z.coerce
    .number()
    .int("Years of experience must be an integer")
    .min(0, "Years of experience cannot be negative"),
  consultation_price: z.coerce
    .number()
    .min(0, "Consultation price cannot be negative"),
  bio: z.string().optional(),
  certification_ref: z
    .string()
    .min(1, "Certification reference is required"),
  cert_image: z.custom<File>(
    (value) => value instanceof File && value.size > 0,
    "Certification image is required"
  ),
  language_ids: z
    .array(z.coerce.number().int().positive("Language ID must be positive"))
    .min(1, "Please add at least one language ID"),
});

export type NutritionistRegistrationInput = z.infer<
  typeof nutritionistRegistrationSchema
>;


register route: register.tsx:
import RegistrationFlow from "@/components/auth/Registration-Flow";

export default function LoginPage() {
return (
<div>
<RegistrationFlow />
</div>
);
}

package.json (for context on what can be worked with):
{
"name": "frontend",
"version": "0.1.0",
"private": true,
"scripts": {
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint"
},
"dependencies": {
"@dnd-kit/core": "^6.3.1",
"@dnd-kit/modifiers": "^9.0.0",
"@dnd-kit/sortable": "^10.0.0",
"@dnd-kit/utilities": "^3.2.2",
"@gsap/react": "^2.1.2",
"@headlessui/react": "^2.2.9",
"@heroicons/react": "^2.2.0",
"@hookform/resolvers": "^5.2.2",
"@radix-ui/react-slot": "^1.2.4",
"@tabler/icons-react": "^3.41.1",
"@tailwindplus/elements": "^1.0.22",
"@tanstack/react-table": "^8.21.3",
"axios": "^1.13.5",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"framer-motion": "^12.34.2",
"gsap": "^3.14.2",
"lucide-react": "^0.564.0",
"next": "16.1.6",
"next-themes": "^0.4.6",
"radix-ui": "^1.4.3",
"react": "19.2.3",
"react-dom": "19.2.3",
"react-hook-form": "^7.71.1",
"recharts": "^2.15.4",
"sonner": "^2.0.7",
"tailwind-merge": "^3.4.1",
"vaul": "^1.1.2",
"zod": "^4.3.6"
},
"devDependencies": {
"@tailwindcss/postcss": "^4",
"@types/node": "^20",
"@types/react": "^19",
"@types/react-dom": "^19",
"eslint": "^9",
"eslint-config-next": "16.1.6",
"shadcn": "^3.8.4",
"tailwindcss": "^4",
"tw-animate-css": "^1.4.0",
"typescript": "^5"
}
}

Project tree:

```
frontend
├─ APIdoc.md
├─ components.json
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├
├─ README.md
├─ src
│  ├─ app
│  │  ├─ (dashboards)
│  │  │  ├─ admin
│  │  │  │  ├─ approvals
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ blog
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ inquiries
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ layout.tsx
│  │  │  │  ├─ moderation
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ plans
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ settings
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ users
│  │  │  │     └─ page.tsx
│  │  │  ├─ client
│  │  │  │  ├─ calorie-tracker
│  │  │  │  │  ├─ history
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ community
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ consultations
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ layout.tsx
│  │  │  │  ├─ meal-plans
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ page.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ profile
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ settings
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ subscription
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ support
│  │  │  │     └─ page.tsx
│  │  │  └─ nutritionist
│  │  │     ├─ consultations
│  │  │     │  └─ page.tsx
│  │  │     ├─ earnings
│  │  │     │  └─ page.tsx
│  │  │     ├─ layout.tsx
│  │  │     ├─ marketplace-plans
│  │  │     │  └─ page.tsx
│  │  │     ├─ page.tsx
│  │  │     ├─ patients
│  │  │     │  └─ page.tsx
│  │  │     ├─ profile
│  │  │     │  └─ page.tsx
│  │  │     ├─ schedule
│  │  │     │  └─ page.tsx
│  │  │     ├─ settings
│  │  │     │  └─ page.tsx
│  │  │     └─ support
│  │  │        └─ page.tsx
│  │  ├─ about
│  │  │  └─ page.tsx
│  │  ├─ actions
│  │  │  └─ submitNutritionistRegistration.ts
│  │  ├─ blog
│  │  │  ├─ page.tsx
│  │  │  └─ [slug]
│  │  │     └─ page.tsx
│  │  ├─ community
│  │  │  └─ page.tsx
│  │  ├─ consultations
│  │  │  ├─ nutritionists
│  │  │  │  └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  └─ schedule
│  │  │     └─ page.tsx
│  │  ├─ dashboard
│  │  │  └─ page.tsx
│  │  ├─ faq
│  │  │  └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ marketplace
│  │  │  └─ page.tsx
│  │  ├─ not-found.tsx
│  │  ├─ page.tsx
│  │  ├─ payment
│  │  │  └─ page.tsx
│  │  ├─ privacypolicy
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  ├─ nutritionist
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ services
│  │  │  └─ page.tsx
│  │  └─ subscription
│  │     └─ page.tsx
│  ├─ components
│  │  ├─ About.tsx
│  │  ├─ ai
│  │  │  └─ aidetection.tsx
│  │  ├─ animations
│  │  │  └─ FadeIn.tsx
│  │  ├─ auth
│  │  │  ├─ login.tsx
│  │  │  ├─ NutritionistRegistrationForm.tsx
│  │  │  └─ Registration-Flow.tsx
│  │  ├─ blogpage.tsx
│  │  ├─ calltoaction.tsx
│  │  ├─ choosenutritionist.tsx
│  │  ├─ communitypage.tsx
│  │  ├─ consultations.tsx
│  │  ├─ content.tsx
│  │  ├─ dashboard
│  │  │  ├─ client
│  │  │  │  ├─ CalorieStats.tsx
│  │  │  │  └─ ProgressChart.tsx
│  │  │  ├─ dashboard.tsx
│  │  │  └─ shared
│  │  │     ├─ DashboardHeader.tsx
│  │  │     ├─ NotificationDropdown.tsx
│  │  │     ├─ SettingsPanel.tsx
│  │  │     ├─ Sidebar.tsx
│  │  │     └─ UserProfileDropdown.tsx
│  │  ├─ FaqPage.tsx
│  │  ├─ faqs.tsx
│  │  ├─ features.tsx
│  │  ├─ forms
│  │  │  ├─ StepActivity.tsx
│  │  │  ├─ StepAgeWeight.tsx
│  │  │  ├─ StepBMI.tsx
│  │  │  ├─ StepCountrySelect.tsx
│  │  │  ├─ StepDiet.tsx
│  │  │  ├─ StepGoal.tsx
│  │  │  ├─ StepHeight.tsx
│  │  │  ├─ StepMedicalHistory.tsx
│  │  │  ├─ StepReview.tsx
│  │  │  └─ StepSignUp.tsx
│  │  ├─ hero-section.tsx
│  │  ├─ layout
│  │  │  ├─ footer.tsx
│  │  │  ├─ logo.tsx
│  │  │  └─ navbar.tsx
│  │  ├─ payment.tsx
│  │  ├─ planmaketplace.tsx
│  │  ├─ PrivacyPolicy.tsx
│  │  ├─ scheduleconsultation.tsx
│  │  ├─ services.tsx
│  │  ├─ shared
│  │  ├─ SingleBlogPostPageComponent.tsx
│  │  ├─ subscription
│  │  │  └─ subscription.tsx
│  │  ├─ testimonials.tsx
│  │  ├─ theme-provider.tsx
│  │  └─ ui
│  │     ├─ accordion.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ Button.tsx
│  │     ├─ Card.tsx
│  │     ├─ checkbox.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ Input.tsx
│  │     ├─ label.tsx
│  │     ├─ ProgressBar.tsx
│  │     ├─ select.tsx
│  │     ├─ separator.tsx
│  │     ├─ sheet.tsx
│  │     ├─ sidebar.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     ├─ theme-toggle.tsx
│  │     └─ tooltip.tsx
│  ├─ context
│  ├─ features
│  ├─ globals.d.ts
│  ├─ hooks
│  │  └─ use-mobile.ts
│  ├─ lib
│  │  ├─ admin
│  │  │  ├─ index.ts
│  │  │  └─ service.ts
│  │  ├─ api.ts
│  │  ├─ auth.ts
│  │  ├─ client
│  │  │  ├─ index.ts
│  │  │  └─ service.ts
│  │  ├─ constants.ts
│  │  ├─ lookups.ts
│  │  ├─ nutritionist
│  │  │  ├─ index.ts
│  │  │  └─ service.ts
│  │  ├─ utils.ts
│  │  └─ validators.ts
│  └─ types
└─ tsconfig.json

```

