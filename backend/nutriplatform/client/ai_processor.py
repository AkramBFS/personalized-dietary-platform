import base64
import logging
from typing import Optional, Dict, Any, List

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone

from .models import AICalorieLog
from . import job_queue

logger = logging.getLogger('nutriplatform.worker')


# ─── Custom Exceptions ────────────────────────────────────────────────────────

class AIServiceError(Exception):
    """Base exception for AI service interaction failures."""
    pass


class AIServiceUnavailableError(AIServiceError):
    """AI service is unreachable or network connection failed (transient / retryable)."""
    pass


class AIServiceTimeoutError(AIServiceError):
    """AI service inference timed out (transient / retryable)."""
    pass


class AIServiceOverloadedError(AIServiceError):
    """AI service rejected request due to queue/concurrency saturation (503 transient / retryable)."""
    def __init__(self, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.retry_after = retry_after


class AIServiceClientError(AIServiceError):
    """AI service rejected image payload as invalid/unsupported (4xx non-retryable)."""
    pass


class AIServiceInferenceError(AIServiceError):
    """AI service 5xx internal inference execution error (transient / retryable)."""
    pass


class AIServiceInvalidResponseError(AIServiceError):
    """AI service returned invalid or unparseable JSON."""
    pass


# ─── Low-Level AI Service Client ──────────────────────────────────────────────

def call_ai_service(
    image_bytes: bytes,
    filename: str = "meal.jpg",
    content_type: str = "image/jpeg"
) -> Dict[str, Any]:
    """
    Invokes the FastAPI AI segmentation service with authentication and timeout guards.
    """
    ai_url = getattr(settings, 'AI_SERVICE_URL', 'http://127.0.0.1:8001')
    secret = getattr(settings, 'AI_SERVICE_SECRET_KEY', None)
    if not secret:
        raise RuntimeError("AI_SERVICE_SECRET_KEY is not configured on backend. Refusing unauthenticated AI call.")

    http_timeout = getattr(settings, 'AI_SERVICE_HTTP_TIMEOUT', 60)
    connect_timeout = getattr(settings, 'AI_SERVICE_CONNECT_TIMEOUT', 10)
    total_timeout = (connect_timeout, http_timeout)

    headers = {'X-Internal-Secret': secret}
    files = {"file": (filename, image_bytes, content_type)}

    try:
        response = requests.post(
            f"{ai_url}/segment?visualize=true",
            headers=headers,
            files=files,
            timeout=total_timeout
        )
    except requests.exceptions.ConnectionError as e:
        logger.warning(f"Connection to AI service at {ai_url} failed: {e}")
        raise AIServiceUnavailableError(f"AI service connection failed: {e}") from e
    except requests.exceptions.Timeout as e:
        logger.warning(f"AI service timed out after {http_timeout}s: {e}")
        raise AIServiceTimeoutError(f"AI service timed out after {http_timeout}s") from e
    except requests.exceptions.RequestException as e:
        logger.warning(f"AI service request error: {e}")
        raise AIServiceError(f"AI service request error: {e}") from e

    # HTTP Status inspection
    if response.status_code == 503:
        retry_after = None
        raw_retry = response.headers.get('Retry-After')
        if raw_retry:
            try:
                retry_after = int(raw_retry)
            except (ValueError, TypeError):
                pass
        raise AIServiceOverloadedError(f"AI service overloaded (HTTP 503): {response.text}", retry_after=retry_after)
    elif response.status_code in (400, 413, 415, 422):
        raise AIServiceClientError(f"AI service rejected image (HTTP {response.status_code}): {response.text}")
    elif response.status_code >= 500:
        # All 5xx server errors treated as transient / retryable
        raise AIServiceInferenceError(f"AI service internal error (HTTP {response.status_code}): {response.text}")
    elif response.status_code != 200:
        raise AIServiceError(f"AI service returned unexpected status HTTP {response.status_code}: {response.text}")

    try:
        data = response.json()
    except Exception as e:
        raise AIServiceInvalidResponseError(f"AI service returned non-JSON response: {e}") from e

    if not isinstance(data, dict):
        raise AIServiceInvalidResponseError(f"AI service response is not a dict: {type(data)}")

    return data


# ─── Nutrition and Image Helpers ──────────────────────────────────────────────

def aggregate_nutrition_from_ai(nutrition_items: list) -> Dict[str, float]:
    """
    Sums macro and calorie values across all detected ingredient items.
    """
    total_calories = 0.0
    total_protein = 0.0
    total_carbs = 0.0
    total_fats = 0.0

    if not isinstance(nutrition_items, list):
        return {
            'total_calories': 0.0,
            'total_protein': 0.0,
            'total_carbs': 0.0,
            'total_fats': 0.0,
        }

    for item in nutrition_items:
        if not isinstance(item, dict):
            continue
        total_calories += float(item.get('calories', 0) or 0)
        total_protein += float(item.get('protein_g', 0) or 0)
        total_carbs += float(item.get('carbohydrates_total_g', 0) or 0)
        total_fats += float(item.get('fat_total_g', 0) or 0)

    return {
        'total_calories': round(total_calories, 2),
        'total_protein': round(total_protein, 2),
        'total_carbs': round(total_carbs, 2),
        'total_fats': round(total_fats, 2),
    }


def save_segmented_image(client_id: int, log_id: int, base64_str: Optional[str]) -> Optional[str]:
    """
    Decodes base64-encoded visual overlay from AI service and persists it to storage.
    """
    if not base64_str:
        return None

    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]

    try:
        image_data = base64.b64decode(base64_str)
        file_path = f'ai_logs/segmented/{client_id}/log_{log_id}_segmented.jpg'
        saved_path = default_storage.save(
            file_path,
            ContentFile(image_data)
        )
        return saved_path
    except Exception as e:
        logger.warning(f"Could not save segmented image for log #{log_id}: {e}")
        return None


# ─── Asynchronous Worker Job Processor ────────────────────────────────────────

def process_calorie_job(job: AICalorieLog) -> bool:
    """
    Executes a claimed calorie estimation job:
    1. Loads meal image from storage.
    2. Sends to AI segmentation service with timeout/admission guards (OUTSIDE db transactions).
    3. Persists segmented overlay visual.
    4. Computes nutrition aggregates.
    5. Transitions job to PENDING_USER_REVIEW via fenced job_queue.complete_job.
    6. Handles errors, retries, and dead-lettering via job_queue.fail_job.
    """
    if not job.image_url:
        logger.error(f"Job #{job.id} has no image_url. Failing job.")
        job_queue.fail_job(
            job.id,
            job.lease_token,
            AICalorieLog.ErrorCode.IMAGE_INVALID,
            "No image URL associated with this log",
            retryable=False
        )
        return False

    import time
    import json
    import os
    t_start = time.perf_counter()

    stub_sleep = float(os.environ.get('AI_WORKER_STUB_SLEEP', 0))
    if stub_sleep > 0:
        time.sleep(stub_sleep)
        success = job_queue.complete_job(
            job_id=job.id,
            lease_token=job.lease_token,
            raw_prediction={"predictions": [{"label": "stub_meal", "mass_grams": 100, "confidence": 0.99, "bbox": [], "mask_pixels": 100}]},
            segmented_image_url="",
            total_calories=250.0,
            total_protein=15.0,
            total_carbs=30.0,
            total_fats=5.0,
        )
        return success

    now = timezone.now()
    queue_wait_ms = 0.0
    if job.logged_at:
        logged_at = job.logged_at
        if timezone.is_naive(logged_at):
            logged_at = timezone.make_aware(logged_at, timezone.get_current_timezone())
        claimed_at = job.claimed_at or now
        if timezone.is_naive(claimed_at):
            claimed_at = timezone.make_aware(claimed_at, timezone.get_current_timezone())
        queue_wait_ms = max(0.0, round((claimed_at - logged_at).total_seconds() * 1000, 2))

    # 1. Read image from storage
    try:
        if not default_storage.exists(job.image_url):
            raise FileNotFoundError(f"Image not found at {job.image_url}")
        with default_storage.open(job.image_url, 'rb') as f:
            image_bytes = f.read()
    except Exception as e:
        logger.error(
            json.dumps({
                "event": "worker_job_processed",
                "log_id": job.id,
                "job_id": job.id,
                "client_id": job.client_id,
                "worker_id": job.claimed_by,
                "attempt": job.retry_count,
                "outcome": "failed",
                "error_code": "IMAGE_INVALID",
                "queue_wait_ms": queue_wait_ms,
                "error": f"Image read failure: {e}",
                "success": False
            })
        )
        job_queue.fail_job(
            job.id,
            job.lease_token,
            AICalorieLog.ErrorCode.IMAGE_INVALID,
            f"Image read failure: {e}",
            retryable=False
        )
        return False

    # 2. Call AI Service with error classification
    t_ai_start = time.perf_counter()
    try:
        ai_data = call_ai_service(image_bytes=image_bytes)
    except AIServiceOverloadedError as e:
        logger.warning(
            json.dumps({
                "event": "worker_job_processed",
                "log_id": job.id,
                "job_id": job.id,
                "client_id": job.client_id,
                "worker_id": job.claimed_by,
                "attempt": job.retry_count,
                "outcome": "retried",
                "error_code": "AI_SERVICE_UNAVAILABLE",
                "queue_wait_ms": queue_wait_ms,
                "error": str(e),
                "success": False
            })
        )
        job_queue.fail_job(
            job.id,
            job.lease_token,
            AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE,
            str(e),
            retryable=True,
            spend_attempt=False,
            delay_seconds=e.retry_after
        )
        return False
    except (AIServiceUnavailableError, AIServiceInferenceError) as e:
        err_code = AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE if isinstance(e, AIServiceUnavailableError) else AICalorieLog.ErrorCode.AI_INFERENCE_ERROR
        logger.warning(
            json.dumps({
                "event": "worker_job_processed",
                "log_id": job.id,
                "job_id": job.id,
                "client_id": job.client_id,
                "worker_id": job.claimed_by,
                "attempt": job.retry_count,
                "outcome": "failed",
                "error_code": str(err_code),
                "queue_wait_ms": queue_wait_ms,
                "error": str(e),
                "success": False
            })
        )
        job_queue.fail_job(
            job.id,
            job.lease_token,
            err_code,
            str(e),
            retryable=True,
            spend_attempt=True
        )
        return False
    except AIServiceTimeoutError as e:
        logger.warning(
            json.dumps({
                "event": "worker_job_processed",
                "log_id": job.id,
                "job_id": job.id,
                "client_id": job.client_id,
                "worker_id": job.claimed_by,
                "attempt": job.retry_count,
                "outcome": "failed",
                "error_code": "AI_INFERENCE_TIMEOUT",
                "queue_wait_ms": queue_wait_ms,
                "error": str(e),
                "success": False
            })
        )
        job_queue.fail_job(
            job.id,
            job.lease_token,
            AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT,
            str(e),
            retryable=True,
            spend_attempt=True
        )
        return False
    except AIServiceClientError as e:
        logger.warning(
            json.dumps({
                "event": "worker_job_processed",
                "log_id": job.id,
                "job_id": job.id,
                "client_id": job.client_id,
                "worker_id": job.claimed_by,
                "attempt": job.retry_count,
                "outcome": "failed",
                "error_code": "IMAGE_INVALID",
                "queue_wait_ms": queue_wait_ms,
                "error": str(e),
                "success": False
            })
        )
        job_queue.fail_job(
            job.id,
            job.lease_token,
            AICalorieLog.ErrorCode.IMAGE_INVALID,
            str(e),
            retryable=False
        )
        return False
    except Exception as e:
        logger.exception(
            json.dumps({
                "event": "worker_job_processed",
                "log_id": job.id,
                "job_id": job.id,
                "client_id": job.client_id,
                "worker_id": job.claimed_by,
                "attempt": job.retry_count,
                "outcome": "failed",
                "error_code": "AI_INFERENCE_ERROR",
                "queue_wait_ms": queue_wait_ms,
                "error": str(e),
                "success": False
            })
        )
        job_queue.fail_job(
            job.id,
            job.lease_token,
            AICalorieLog.ErrorCode.AI_INFERENCE_ERROR,
            f"Inference failure: {e}",
            retryable=False
        )
        return False

    t_ai_end = time.perf_counter()
    infer_ms = round((t_ai_end - t_ai_start) * 1000, 2)

    # 3. Parse detections and compute nutrition
    ingredients = ai_data.get('ingredients', [])
    visual_b64 = ai_data.get('visual', None)
    t_nut_start = time.perf_counter()

    nutrition_items = []
    nutrition_totals = {'total_calories': 0.0, 'total_protein': 0.0, 'total_carbs': 0.0, 'total_fats': 0.0}

    # If AI payload already includes nutrition items (legacy/mock compatibility), use it
    if 'nutrition' in ai_data and ai_data['nutrition']:
        raw_nut = ai_data['nutrition']
        if isinstance(raw_nut, dict) and 'items' in raw_nut:
            nutrition_items = raw_nut['items']
        elif isinstance(raw_nut, list):
            nutrition_items = raw_nut
        nutrition_totals = aggregate_nutrition_from_ai(nutrition_items)
    else:
        # Compute nutrition inside Django worker via apiNinja
        ingredient_payload = [
            {
                "name": item.get('ingredient', ''),
                "mass_grams": max(1.0, float(item.get('estimated_mass_g', 100)))
            }
            for item in ingredients
            if item.get('ingredient')
        ]
        if ingredient_payload:
            try:
                from .apiNinja import get_nutrition_data
                nut_data = get_nutrition_data(ingredient_payload)
                nutrition_totals = {
                    'total_calories': nut_data.get('total_calories', 0.0),
                    'total_protein': nut_data.get('total_protein', 0.0),
                    'total_carbs': nut_data.get('total_carbs', 0.0),
                    'total_fats': nut_data.get('total_fats', 0.0),
                }
                nutrition_items = nut_data.get('foods', [])
            except Exception as e:
                logger.warning(f"Worker nutrition calculation fallback for job #{job.id}: {e}")

    t_nut_end = time.perf_counter()
    nutrition_ms = round((t_nut_end - t_nut_start) * 1000, 2)

    ai_raw_prediction = {
        "predictions": [
            {
                "label": item.get('ingredient', ''),
                "mass_grams": item.get('estimated_mass_g', 0),
                "confidence": item.get('confidence', 0),
                "bbox": item.get('bbox', []),
                "mask_pixels": item.get('mask_pixels', 0),
            }
            for item in ingredients
        ],
        "nutrition_raw": nutrition_items,
        "num_ingredients": ai_data.get('num_ingredients', len(ingredients)),
    }

    # 4. Save segmented overlay
    t_overlay_start = time.perf_counter()
    segmented_path = save_segmented_image(
        client_id=job.client_id,
        log_id=job.id,
        base64_str=visual_b64
    )
    t_overlay_end = time.perf_counter()
    overlay_ms = round((t_overlay_end - t_overlay_start) * 1000, 2)

    # 5. Complete job atomically under lease fence and owner context
    success = job_queue.complete_job(
        job_id=job.id,
        lease_token=job.lease_token,
        raw_prediction=ai_raw_prediction,
        segmented_image_url=segmented_path,
        total_calories=nutrition_totals['total_calories'],
        total_protein=nutrition_totals['total_protein'],
        total_carbs=nutrition_totals['total_carbs'],
        total_fats=nutrition_totals['total_fats'],
    )

    total_ms = round((time.perf_counter() - t_start) * 1000, 2)
    logger.info(
        json.dumps({
            "event": "worker_job_processed",
            "log_id": job.id,
            "job_id": job.id,
            "client_id": job.client_id,
            "worker_id": job.claimed_by,
            "attempt": job.retry_count,
            "outcome": "completed" if success else "failed",
            "error_code": None if success else "LEASE_FENCE_FAILED",
            "queue_wait_ms": queue_wait_ms,
            "inference_ms": infer_ms,
            "nutrition_ms": nutrition_ms,
            "overlay_ms": overlay_ms,
            "total_ms": total_ms,
            "success": success
        })
    )

    return success