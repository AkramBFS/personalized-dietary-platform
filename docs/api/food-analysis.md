# AI Food Analysis API Contract (v1)

This document defines the REST API contract for the asynchronous AI calorie estimation pipeline in NutriPlatform. All endpoints require client authentication (`Authorization: Bearer <token>`) and an active premium subscription (`IsPremiumClient`).

---

## 1. Endpoints Overview

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/v1/client/calorie-tracker/ai/` | Submit meal photo for async processing | `202 Accepted`, `400`, `409`, `429`, `503` |
| `GET` | `/api/v1/client/calorie-tracker/ai/active/` | Retrieve active in-flight or pending job | `200 OK` (with job data or `null`) |
| `GET` | `/api/v1/client/calorie-tracker/ai/<id>/status/` | Poll status & retrieve predictions/nutrition | `200 OK`, `404 Not Found` |
| `POST` | `/api/v1/client/calorie-tracker/ai/<id>/cancel/` | Cancel a `queued` job | `200 OK`, `400 Invalid State`, `404` |
| `POST` | `/api/v1/client/calorie-tracker/ai/<id>/discard/` | Discard a `pending_user_review` job | `200 OK`, `400 Invalid State`, `404` |
| `POST`/`PATCH` | `/api/v1/client/calorie-tracker/ai/<id>/confirm/` | Confirm ingredients & update daily progress | `200 OK` (Idempotent), `400`, `404` |
| `GET` | `/api/v1/client/calorie-tracker/ai/<id>/overlay/` | Stream segmented visual overlay (Owner-only) | `200 OK` (`image/jpeg`), `403 Forbidden`, `404` |

---

## 2. Detailed Specifications

### 2.1 Submit Meal Photo
- **Endpoint:** `POST /api/v1/client/calorie-tracker/ai/`
- **Content-Type:** `multipart/form-data`
- **Request Fields:**
  - `image` (File, required): JPEG, PNG, or WebP (max 10 MB).
  - `meal_type` (String, required): One of `breakfast`, `lunch`, `dinner`, `snack`.

#### Response: `202 Accepted` (Asynchronous Mode)
```json
{
  "status": "success",
  "data": {
    "log_id": 142,
    "status": "queued",
    "meal_type": "lunch",
    "queue_position": 2,
    "eta_seconds": 6,
    "poll_after_ms": 1000,
    "logged_at": "2026-10-03T10:15:00.000Z"
  }
}
```

#### Response: `202 Accepted` (Rollback Inline Sync Mode: `AI_ASYNC_PIPELINE=False`)
```json
{
  "status": "success",
  "data": {
    "log_id": 142,
    "status": "pending_user_review",
    "meal_type": "lunch",
    "segmented_image_url": "ai_logs/segmented/42/uuid.jpg",
    "predictions": [
      {"label": "rice", "mass_grams": 150.0, "confidence": 0.95}
    ],
    "nutrition_preview": {
      "total_calories": 195.0,
      "total_protein": 4.0,
      "total_carbs": 43.0,
      "total_fats": 0.5
    },
    "logged_at": "2026-10-03T10:15:00.000Z"
  }
}
```

#### Error Responses:
- **`400 Bad Request`:** `{"status": "error", "code": "IMAGE_INVALID" | "INVALID_MEAL_TYPE" | "IMAGE_REQUIRED", "message": "..."}`
- **`409 Conflict`:** `{"status": "error", "code": "IN_FLIGHT_JOB_EXISTS", "message": "An AI calorie estimation job is already in flight.", "active_job_id": 141}`
- **`429 Too Many Requests` (Daily Quota):** `{"status": "error", "code": "DAILY_QUOTA_EXCEEDED", "message": "Daily AI calorie estimation quota exceeded (30/day).", "resets_at": "2026-10-04T08:30:00.000Z"}`
- **`429 Too Many Requests` (Burst Throttle):** `{"detail": "Request was throttled. Expected available in 10 seconds."}`
- **`503 Service Unavailable` (Global Queue Cap):** `{"status": "error", "code": "SYSTEM_BUSY", "message": "AI analysis queue is currently at maximum capacity. Please retry shortly.", "retry_after": 5}`

---

### 2.2 Get Active In-Flight Job
- **Endpoint:** `GET /api/v1/client/calorie-tracker/ai/active/`
- **Response `200 OK` (Job exists):** Same structure as Status View.
- **Response `200 OK` (No active job):**
```json
{
  "status": "success",
  "data": null
}
```

---

### 2.3 Poll Job Status
- **Endpoint:** `GET /api/v1/client/calorie-tracker/ai/<id>/status/`
- **Response `200 OK` (Queued / Processing):**
```json
{
  "status": "success",
  "data": {
    "log_id": 142,
    "status": "queued",
    "meal_type": "lunch",
    "queue_position": 1,
    "eta_seconds": 3,
    "poll_after_ms": 1500,
    "predictions": [],
    "nutrition_preview": {
      "total_calories": null,
      "total_protein": null,
      "total_carbs": null,
      "total_fats": null
    },
    "overlay_url": null,
    "error_code": "",
    "error_message": "",
    "logged_at": "2026-10-03T10:15:00.000Z",
    "completed_at": null
  }
}
```
- **Response `200 OK` (Pending User Review):**
```json
{
  "status": "success",
  "data": {
    "log_id": 142,
    "status": "pending_user_review",
    "meal_type": "lunch",
    "queue_position": 0,
    "eta_seconds": 0,
    "poll_after_ms": 0,
    "predictions": [
      {"label": "rice", "mass_grams": 150.0, "confidence": 0.95},
      {"label": "grilled chicken breast", "mass_grams": 120.0, "confidence": 0.91}
    ],
    "nutrition_preview": {
      "total_calories": 395.0,
      "total_protein": 38.0,
      "total_carbs": 43.0,
      "total_fats": 4.5
    },
    "overlay_url": "/api/v1/client/calorie-tracker/ai/142/overlay/",
    "error_code": "",
    "error_message": "",
    "logged_at": "2026-10-03T10:15:00.000Z",
    "completed_at": "2026-10-03T10:15:04.120Z"
  }
}
```
- **Response `200 OK` (Failed):**
```json
{
  "status": "success",
  "data": {
    "log_id": 142,
    "status": "failed",
    "error_code": "AI_INFERENCE_TIMEOUT",
    "error_message": "Job exceeded maximum queue lifetime of 180s",
    "predictions": [],
    "nutrition_preview": {},
    "overlay_url": null,
    "completed_at": "2026-10-03T10:18:00.000Z"
  }
}
```

---

### 2.4 Cancel & Discard
- **Cancel Queued Job:** `POST /api/v1/client/calorie-tracker/ai/<id>/cancel/`
  - Valid when status is `queued`. Transitions to `cancelled`.
- **Discard Review Job:** `POST /api/v1/client/calorie-tracker/ai/<id>/discard/`
  - Valid when status is `pending_user_review`. Transitions to `discarded`.
- **Response `200 OK`:**
```json
{
  "status": "success",
  "message": "AI calorie log discarded.",
  "data": {
    "log_id": 142,
    "status": "discarded"
  }
}
```

---

### 2.5 Confirm Ingredients & Save
- **Endpoint:** `POST` or `PATCH /api/v1/client/calorie-tracker/ai/<id>/confirm/`
- **Request Body:**
```json
{
  "meal_type": "lunch",
  "user_final_log": [
    {"name": "rice", "mass_grams": 160.0},
    {"name": "grilled chicken breast", "mass_grams": 130.0}
  ]
}
```
- **Response `200 OK` (Idempotent):**
```json
{
  "status": "success",
  "data": {
    "log_id": 142,
    "status": "saved",
    "total_calories": 420.0,
    "total_protein": 41.0,
    "total_carbs": 46.0,
    "total_fats": 5.0,
    "daily_progress": {
      "log_date": "2026-10-03",
      "total_calories_consumed": 1250.0,
      "total_protein_consumed": 85.0,
      "total_carbs_consumed": 140.0,
      "total_fats_consumed": 35.0,
      "is_goal_achieved": false
    }
  }
}
```

---

### 2.6 Owner-Only Visual Overlay
- **Endpoint:** `GET /api/v1/client/calorie-tracker/ai/<id>/overlay/`
- **Authorization:** Authenticated client who owns the log. (Other users receive `403 Forbidden`).
- **Response `200 OK`:** Binary JPEG stream (`Content-Type: image/jpeg`).
- **Frontend Note:** Next.js frontend fetches or proxies this image with `Authorization: Bearer <token>`.

---

## 3. Error Codes & User-Facing Messages

| Error Code | User-Facing Message | Retryable? | Quota Counted? |
|---|---|---|---|
| `IN_FLIGHT_JOB_EXISTS` | "You already have an analysis in progress. Please wait for it to complete." | Yes (wait) | No |
| `DAILY_QUOTA_EXCEEDED` | "You have reached your daily meal analysis limit (30/day). Resets at {resets_at}." | No (wait 24h) | No |
| `SYSTEM_BUSY` | "The AI analysis service is experiencing high traffic. Please retry in a few seconds." | Yes (5s) | No |
| `IMAGE_INVALID` | "The uploaded file is not a valid or supported image (JPEG/PNG/WebP only)." | No (upload new) | Yes |
| `IMAGE_TOO_LARGE` | "Image size exceeds the maximum limit of 10 MB." | No (upload new) | Yes |
| `AI_SERVICE_UNAVAILABLE` | "The AI analysis service is temporarily offline. Please try again later." | Yes | No (excluded) |
| `AI_INFERENCE_TIMEOUT` | "Analysis timed out in the queue. Please resubmit your meal photo." | Yes | No (excluded) |
| `AI_INFERENCE_ERROR` | "An error occurred while analyzing the image. Please retry." | Yes | No (excluded) |
| `NUTRITION_API_ERROR` | "Unable to retrieve nutrition data for the selected ingredients." | Yes | No (excluded) |
| `WORKER_CRASHED` | "Analysis worker encountered an unexpected error. Please retry." | Yes | No (excluded) |
| `CANCELLED` | "Meal analysis was cancelled." | No | Yes |

---

## 4. Frontend Compatibility & Deployment Notice

> [!IMPORTANT]
> **Atomic Deployment Requirement:** The previous frontend expected a synchronous HTTP POST response directly returning nutrition and ingredients. The Session D backend returns a `202 Accepted` asynchronous job structure (`log_id`, `queue_position`, `poll_after_ms`).
> 
> Therefore, **Backend Session D must ship atomically together with Frontend Session E**. If the backend is deployed alone before Session E, the `AI_ASYNC_PIPELINE=False` setting must be kept enabled for backward compatibility until Session E is deployed.