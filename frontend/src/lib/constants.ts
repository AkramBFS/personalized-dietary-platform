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
  z.object({ bmi: z.number().min(10).max(60) }),        // Step 7
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
    phone: z.string().optional(),
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
