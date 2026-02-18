import { z } from "zod";

export const stepSchemas = [
  z.object({ country: z.string().min(1, "Required") }), // Step 1
  z.object({ goal: z.string().min(1, "Required") }),    // Step 2
  z.object({ activityLevel: z.string().min(1) }),       // Step 3
  z.object({ diet: z.string().min(1) }),                // Step 4
  z.object({ 
    age: z.number().min(16).max(100), 
    weight: z.number().min(30).max(300) 
  }),                                                   // Step 5
  z.object({ height: z.number().min(120).max(250) }),   // Step 6
  z.object({ bmi: z.number().min(10).max(60) }),        // Step 7
  z.object({ medicalConditions: z.array(z.string()) }), // Step 8
  z.object({ sleepHours: z.number().min(3).max(12) }),  // Step 9
  z.object({ agreedToTerms: z.literal(true) }),         // Step 10
];