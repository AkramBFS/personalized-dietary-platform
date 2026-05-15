import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a nutritionist's name by extracting the last name and adding "Dr." prefix.
 * Example: "Luke Atme" -> "Dr. Atme"
 */
export function formatNutritionistName(fullName: string | undefined): string {
  if (!fullName) return "Nutritionist";
  
  // Remove existing "Dr.", "Nutritionist", or "Doctor" to handle consistently
  const cleanName = fullName.replace(/^(Dr\.|Nutritionist|Doctor)\s*/i, "").trim();
  
  if (!cleanName || cleanName.toLowerCase() === "doctor" || cleanName.toLowerCase() === "nutritionist") {
    return "Nutritionist";
  }
  
  const parts = cleanName.split(/\s+/);
  // If there's more than one part, use the last one as the lastName
  const lastName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  
  return `Dr. ${lastName}`;
}


/**
 * Formats a client's name by extracting the first name.
 * Example: "Luke Atme" -> "Luke"
 */
export function formatClientName(fullName: string | undefined): string {
  if (!fullName) return "there";
  
  const cleanName = fullName.trim();
  if (!cleanName) return "there";
  
  const parts = cleanName.split(/\s+/);
  return parts[0];
}


