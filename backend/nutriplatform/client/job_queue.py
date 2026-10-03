import logging
import uuid
from datetime import timedelta
from typing import Optional, Dict, Any

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone

from nutriplatform.middleware.rls import set_rls_context
from .models import AICalorieLog

logger = logging.getLogger('nutriplatform.worker')


def claim_next_job(
    worker_id: str,
    lease_timeout_seconds: Optional[int] = None,
    max_attempts: Optional[int] = None,
    max_age_seconds: Optional[int] = None
) -> Optional[AICalorieLog]:
    """
    Atomically claims the next available calorie estimation job using PostgreSQL SKIP LOCKED.
    
    A job is claimable if:
    1. status == 'queued' AND (available_at IS NULL OR available_at <= now)
    2. status == 'processing' AND claimed_at <= (now - lease_timeout_seconds)  [stale worker recovery]
    
    Enforces AI_JOB_MAX_AGE_SECONDS and AI_JOB_MAX_ATTEMPTS. Expired or over-attempted jobs
    are marked FAILED immediately and the loop advances to the next valid candidate.
    """
    lease_timeout = lease_timeout_seconds or getattr(settings, 'AI_JOB_LEASE_TIMEOUT_SECONDS', 90)
    max_retries = max_attempts or getattr(settings, 'AI_JOB_MAX_ATTEMPTS', 3)
    max_age = max_age_seconds or getattr(settings, 'AI_JOB_MAX_AGE_SECONDS', 180)

    # Clean up or claim up to 10 candidates per invocation
    for _ in range(10):
        with transaction.atomic():
            set_rls_context(is_system_worker=True)
            now = timezone.now()
            stale_threshold = now - timedelta(seconds=lease_timeout)

            candidate = AICalorieLog.objects.select_for_update(skip_locked=True).filter(
                (models.Q(status=AICalorieLog.Status.QUEUED) & (models.Q(available_at__isnull=True) | models.Q(available_at__lte=now))) |
                (models.Q(status=AICalorieLog.Status.PROCESSING) & models.Q(claimed_at__lte=stale_threshold))
            ).order_by('logged_at').first()

            if candidate is None:
                return None

            # Check 1: Max age expiration
            logged_at = candidate.logged_at
            if logged_at and timezone.is_naive(logged_at):
                logged_at = timezone.make_aware(logged_at, timezone.get_current_timezone())
            age_seconds = (now - logged_at).total_seconds() if logged_at else 0
            if age_seconds > max_age:
                logger.warning(
                    f"Job #{candidate.id} expired in queue (age={age_seconds:.1f}s > {max_age}s). Marking FAILED."
                )
                candidate.status = AICalorieLog.Status.FAILED
                candidate.error_code = AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT
                candidate.error_message = f"Job exceeded max queue lifetime of {max_age}s"
                candidate.completed_at = now
                candidate.save(update_fields=['status', 'error_code', 'error_message', 'completed_at', 'updated_at'])
                continue

            # Check 2: Max retry attempts exceeded
            if candidate.retry_count >= max_retries:
                logger.warning(
                    f"Job #{candidate.id} exceeded max attempts ({candidate.retry_count} >= {max_retries}). Marking FAILED."
                )
                candidate.status = AICalorieLog.Status.FAILED
                candidate.error_code = AICalorieLog.ErrorCode.WORKER_CRASHED
                candidate.error_message = f"Job exceeded maximum retry attempts ({max_retries})"
                candidate.completed_at = now
                candidate.save(update_fields=['status', 'error_code', 'error_message', 'completed_at', 'updated_at'])
                continue

            # Valid candidate: assign lease token and transition to PROCESSING
            new_lease_token = uuid.uuid4()
            candidate.retry_count += 1
            candidate.status = AICalorieLog.Status.PROCESSING
            candidate.claimed_by = worker_id
            candidate.claimed_at = now
            candidate.lease_token = new_lease_token
            candidate.save(update_fields=[
                'status', 'claimed_by', 'claimed_at', 'lease_token', 'retry_count', 'updated_at'
            ])
            logger.info(
                f"Worker {worker_id} claimed job #{candidate.id} (attempt {candidate.retry_count}/{max_retries}, lease={new_lease_token})"
            )
            return candidate

    return None


def complete_job(
    job_id: int,
    lease_token: uuid.UUID,
    raw_prediction: dict,
    segmented_image_url: Optional[str] = None,
    total_calories: Optional[float] = None,
    total_protein: Optional[float] = None,
    total_carbs: Optional[float] = None,
    total_fats: Optional[float] = None
) -> bool:
    """
    Atomically transitions a job from PROCESSING to PENDING_USER_REVIEW,
    fenced by the unique lease_token.
    
    Finalizes the record under the job owner's RLS user context.
    Returns True if the update succeeded, or False if the lease was lost / stolen / cancelled.
    """
    with transaction.atomic():
        # Retrieve job to identify the owning user for RLS context
        set_rls_context(is_system_worker=True)
        job = AICalorieLog.objects.select_related('client__user').filter(
            id=job_id,
            lease_token=lease_token,
            status=AICalorieLog.Status.PROCESSING
        ).first()

        if not job:
            logger.warning(
                f"Fence rejection: complete_job failed for job #{job_id} (lease_token {lease_token} invalid or job cancelled/reclaimed)"
            )
            return False

        # Set RLS context to the owning user for writing results
        owner_user = getattr(job.client, 'user', None)
        if owner_user:
            set_rls_context(owner_user)

        now = timezone.now()
        job.status = AICalorieLog.Status.PENDING_USER_REVIEW
        job.ai_raw_prediction = raw_prediction
        if segmented_image_url:
            job.segmented_image_url = segmented_image_url
        job.total_calories = total_calories
        job.total_protein = total_protein
        job.total_carbs = total_carbs
        job.total_fats = total_fats
        job.completed_at = now
        
        update_fields = [
            'status', 'ai_raw_prediction', 'total_calories',
            'total_protein', 'total_carbs', 'total_fats', 'completed_at', 'updated_at'
        ]
        if segmented_image_url:
            update_fields.append('segmented_image_url')

        job.save(update_fields=update_fields)
        logger.info(f"Job #{job_id} successfully finalized under owner {owner_user} context (PENDING_USER_REVIEW).")
        return True


def fail_job(
    job_id: int,
    lease_token: uuid.UUID,
    error_code: str,
    error_message: str,
    retryable: bool = False,
    spend_attempt: bool = True,
    delay_seconds: Optional[int] = None
) -> bool:
    """
    Transitions a job to FAILED (or resets to QUEUED if retryable and under attempt limit),
    fenced by the unique lease_token.
    
    - spend_attempt=False: reverts retry_count increment (e.g. 503 Retry-After backpressure).
    - delay_seconds: schedules available_at with explicit delay or backoff schedule (5s/20s/60s).
    
    Returns True if updated, or False if the lease was lost / stolen / cancelled.
    """
    with transaction.atomic():
        set_rls_context(is_system_worker=True)
        job = AICalorieLog.objects.select_for_update().filter(
            id=job_id,
            lease_token=lease_token,
            status=AICalorieLog.Status.PROCESSING
        ).first()

        if not job:
            logger.warning(
                f"Fence rejection: fail_job failed for job #{job_id} (lease_token {lease_token} invalid or job cancelled/reclaimed)"
            )
            return False

        max_retries = getattr(settings, 'AI_JOB_MAX_ATTEMPTS', 3)
        now = timezone.now()

        if retryable and job.retry_count <= max_retries:
            if not spend_attempt:
                job.retry_count = max(0, job.retry_count - 1)

            # Determine backoff delay
            backoff_schedule = getattr(settings, 'AI_JOB_BACKOFF_SCHEDULE', [5, 20, 60])
            if delay_seconds is not None:
                delay = delay_seconds
            else:
                idx = min(max(0, job.retry_count - 1), len(backoff_schedule) - 1)
                delay = backoff_schedule[idx]

            job.status = AICalorieLog.Status.QUEUED
            job.claimed_by = ''
            job.claimed_at = None
            job.lease_token = None
            job.available_at = now + timedelta(seconds=delay)
            job.error_code = error_code
            job.error_message = error_message
            job.save(update_fields=[
                'status', 'claimed_by', 'claimed_at', 'lease_token', 'available_at',
                'retry_count', 'error_code', 'error_message', 'updated_at'
            ])
            logger.info(
                f"Job #{job_id} re-enqueued for retry in {delay}s (attempt {job.retry_count}/{max_retries}, error: {error_code})"
            )
            return True
        else:
            job.status = AICalorieLog.Status.FAILED
            job.error_code = error_code
            job.error_message = error_message
            job.completed_at = now
            job.save(update_fields=[
                'status', 'error_code', 'error_message', 'completed_at', 'updated_at'
            ])
            logger.info(
                f"Job #{job_id} marked FAILED (error: {error_code}: {error_message})"
            )
            return True


def get_queue_metrics(lease_timeout_seconds: Optional[int] = None) -> Dict[str, Any]:
    """
    Returns real-time queue depth and health metrics.
    """
    lease_timeout = lease_timeout_seconds or getattr(settings, 'AI_JOB_LEASE_TIMEOUT_SECONDS', 90)
    stale_threshold = timezone.now() - timedelta(seconds=lease_timeout)

    counts = AICalorieLog.objects.aggregate(
        queued_count=models.Count('id', filter=models.Q(status=AICalorieLog.Status.QUEUED)),
        processing_count=models.Count('id', filter=models.Q(status=AICalorieLog.Status.PROCESSING)),
        stale_count=models.Count(
            'id',
            filter=models.Q(status=AICalorieLog.Status.PROCESSING, claimed_at__lte=stale_threshold)
        ),
        pending_review_count=models.Count('id', filter=models.Q(status=AICalorieLog.Status.PENDING_USER_REVIEW)),
        failed_count=models.Count('id', filter=models.Q(status=AICalorieLog.Status.FAILED)),
        saved_count=models.Count('id', filter=models.Q(status=AICalorieLog.Status.SAVED)),
    )
    return counts
