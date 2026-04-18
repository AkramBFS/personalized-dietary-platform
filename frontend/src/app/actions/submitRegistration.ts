"use server";

import { stepSchemas } from "@/lib/constants";
import { z } from "zod";

export async function submitRegistration(formData: any) {
  // Merge all step schemas into one final validator
  const fullSchema = stepSchemas.reduce(
    (acc, schema) => acc.merge(schema),
    z.object({})
  );

  const parsed = fullSchema.safeParse(formData);

  if (!parsed.success) {
    console.error("Server Validation Error:", parsed.error.format());
    throw new Error("Validation failed.");
  }


  await new Promise((res) => setTimeout(res, 2000));

  return { success: true };
}