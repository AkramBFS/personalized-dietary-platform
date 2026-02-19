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
    weight: z.number().min(30).max(300) 
  }),                                                   // Step 5
  z.object({ height: z.number().min(120).max(250) }),   // Step 6
  z.object({ bmi: z.number().min(10).max(60) }),        // Step 7
  z.object({
  medicalConditions: z.array(z.string()).min(1, "Please select at least one option (or 'None')"),
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