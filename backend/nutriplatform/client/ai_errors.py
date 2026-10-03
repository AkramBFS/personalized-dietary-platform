"""
User-safe copy for AI calorie-estimation error codes.

AICalorieLog.error_message stores internal diagnostics (upstream response bodies, storage paths,
exception text). That text is for operators only and must never be returned to clients.
API responses expose `error_code` plus the message from this table.

Keep in sync with docs/api/food-analysis.md and frontend/src/lib/client/aiErrors.ts.
"""

SAFE_ERROR_MESSAGES = {
    # Request-time codes
    "IN_FLIGHT_JOB_EXISTS": "You already have an analysis in progress. Please wait for it to finish.",
    "DAILY_QUOTA_EXCEEDED": "You have reached your daily meal analysis limit.",
    "SYSTEM_BUSY": "The analysis service is busy right now. Please try again in a few seconds.",
    "RATE_LIMITED": "You are submitting too quickly. Please wait a moment and try again.",
    "INVALID_MEAL_TYPE": "Please choose a valid meal type.",
    "IMAGE_REQUIRED": "Please choose a meal photo to analyze.",
    # Job failure codes (AICalorieLog.ErrorCode)
    "IMAGE_INVALID": "We couldn't read that image. Please upload a clear JPEG, PNG or WebP photo.",
    "IMAGE_TOO_LARGE": "That image is too large. Please choose a smaller photo.",
    "AI_SERVICE_UNAVAILABLE": "The analysis service is temporarily unavailable. Please try again later.",
    "AI_INFERENCE_TIMEOUT": "The analysis took too long and was stopped. Please try again.",
    "AI_INFERENCE_ERROR": "Something went wrong while analyzing your photo. Please try again.",
    "NUTRITION_API_ERROR": "We couldn't look up nutrition data for this meal. Please try again.",
    "WORKER_CRASHED": "The analysis was interrupted. Please try again.",
    "LEGACY_ABANDONED": "This analysis was interrupted by a system update. Please try again.",
    "CANCELLED": "This analysis was cancelled.",
}

GENERIC_ERROR_MESSAGE = "Something went wrong while analyzing your photo. Please try again."


def safe_error_message(error_code: str) -> str:
    """Return the client-safe message for an error code ('' when there is no error)."""
    if not error_code:
        return ""
    return SAFE_ERROR_MESSAGES.get(error_code, GENERIC_ERROR_MESSAGE)
