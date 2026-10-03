export const AI_ERROR_MESSAGES: Record<string, string> = {
  IN_FLIGHT_JOB_EXISTS:
    "You already have an analysis in progress. Please wait for it to complete.",
  DAILY_QUOTA_EXCEEDED:
    "You have reached your daily meal analysis limit (30/day). Please log meals manually.",
  SYSTEM_BUSY:
    "The AI analysis service is experiencing high traffic. Please retry in a few seconds or log manually.",
  IMAGE_INVALID:
    "The uploaded file is not a valid or supported image (JPEG, PNG, or WebP only).",
  IMAGE_TOO_LARGE:
    "Image size exceeds the maximum limit of 10 MB.",
  AI_SERVICE_UNAVAILABLE:
    "The AI analysis service is temporarily unavailable. You can log this meal manually.",
  AI_INFERENCE_TIMEOUT:
    "Analysis timed out in the queue. You can resubmit or log this meal manually.",
  AI_INFERENCE_ERROR:
    "An error occurred while analyzing the meal photo. You can retry or log manually.",
  NUTRITION_API_ERROR:
    "Unable to calculate nutrition data for the detected ingredients.",
  WORKER_CRASHED:
    "Analysis worker encountered an unexpected error. Please retry or log manually.",
  CANCELLED:
    "Meal analysis was cancelled.",
  NOT_PREMIUM:
    "AI Vision Tracker requires an active premium subscription.",
  DEFAULT:
    "AI analysis failed. Please try again or log your meal manually.",
};

export function getAiErrorMessage(code?: string | null, fallbackMessage?: string | null): string {
  if (code && AI_ERROR_MESSAGES[code]) {
    return AI_ERROR_MESSAGES[code];
  }
  if (fallbackMessage && fallbackMessage.trim()) {
    return fallbackMessage;
  }
  return AI_ERROR_MESSAGES.DEFAULT;
}

export function shouldSuggestManualLogging(code?: string | null): boolean {
  if (!code) return true;
  return [
    "DAILY_QUOTA_EXCEEDED",
    "SYSTEM_BUSY",
    "AI_SERVICE_UNAVAILABLE",
    "AI_INFERENCE_TIMEOUT",
    "AI_INFERENCE_ERROR",
    "WORKER_CRASHED",
  ].includes(code);
}
