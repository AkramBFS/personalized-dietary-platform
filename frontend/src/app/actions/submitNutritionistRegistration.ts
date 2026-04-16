"use server";

import { nutritionistRegistrationSchema } from "@/lib/constants";

type NutritionistPayload = {
  username: string;
  email: string;
  password: string;
  country_id: number | string;
  specialization_id: number | string;
  years_experience: number | string;
  consultation_price: number | string;
  bio?: string;
  certification_ref: string;
  cert_image: File;
  language_ids: Array<number | string>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.nutriplatform.com/api/v1";

const normalizeErrorMessage = (errorBody: unknown): string => {
  if (!errorBody || typeof errorBody !== "object") {
    return "Unable to register at the moment. Please try again.";
  }

  const values = Object.values(errorBody as Record<string, unknown>);
  for (const value of values) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
    if (typeof value === "string") {
      return value;
    }
  }

  return "Unable to register at the moment. Please try again.";
};

export async function submitNutritionistRegistration(rawData: NutritionistPayload) {
  const parsed = nutritionistRegistrationSchema.safeParse(rawData);

  if (!parsed.success) {
    throw new Error("Validation failed. Please check your form details.");
  }

  const body = new FormData();
  body.append("username", parsed.data.username);
  body.append("email", parsed.data.email);
  body.append("password", parsed.data.password);
  body.append("country_id", String(parsed.data.country_id));
  body.append("specialization_id", String(parsed.data.specialization_id));
  body.append("years_experience", String(parsed.data.years_experience));
  body.append("consultation_price", String(parsed.data.consultation_price));
  body.append("certification_ref", parsed.data.certification_ref);
  body.append("cert_image", parsed.data.cert_image);

  if (parsed.data.bio?.trim()) {
    body.append("bio", parsed.data.bio.trim());
  }

  parsed.data.language_ids.forEach((languageId) => {
    body.append("language_ids", String(languageId));
  });

  const response = await fetch(`${API_BASE_URL}/auth/register/nutritionist/`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }
    throw new Error(normalizeErrorMessage(errorBody));
  }

  return response.json();
}
