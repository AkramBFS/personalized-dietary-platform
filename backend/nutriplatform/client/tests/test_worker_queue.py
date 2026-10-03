import io
import uuid
from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management import call_command
from django.db import connection, transaction
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from PIL import Image

from client import job_queue, ai_processor
from client.models import Client, AICalorieLog
from users.models import User
from nutriplatform.middleware.rls import set_rls_context, clear_rls_context


class WorkerJobQueueUnitTests(TestCase):
    """Unit tests for PostgreSQL SKIP LOCKED claim engine, backoff, and lease token fencing."""

    def setUp(self):
        self.user = User.objects.create_user(email="worker_test@example.com", username="worker_test", role="client")
        self.client = Client.objects.create(user=self.user, is_premium=True)

        # Create dummy image in storage
        img_buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='blue').save(img_buf, format='JPEG')
        self.image_path = default_storage.save(
            f'ai_logs/original/{self.client.client_id}/test_meal.jpg',
            ContentFile(img_buf.getvalue())
        )

    def tearDown(self):
        if default_storage.exists(self.image_path):
            default_storage.delete(self.image_path)

    def test_claim_next_job_fifo(self):
        """Verify FIFO ordering when claiming queued jobs."""
        now = timezone.now()
        log1 = AICalorieLog.objects.create(
            client=self.client,
            meal_type='breakfast',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )
        AICalorieLog.objects.filter(id=log1.id).update(logged_at=now - timedelta(seconds=30))

        log2 = AICalorieLog.objects.create(
            client=self.client,
            meal_type='lunch',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )
        AICalorieLog.objects.filter(id=log2.id).update(logged_at=now - timedelta(seconds=10))

        claimed1 = job_queue.claim_next_job(worker_id="worker-1")
        self.assertIsNotNone(claimed1)
        self.assertEqual(claimed1.id, log1.id)
        self.assertEqual(claimed1.status, AICalorieLog.Status.PROCESSING)
        self.assertEqual(claimed1.claimed_by, "worker-1")
        self.assertEqual(claimed1.retry_count, 1)
        self.assertIsNotNone(claimed1.lease_token)

        claimed2 = job_queue.claim_next_job(worker_id="worker-2")
        self.assertIsNotNone(claimed2)
        self.assertEqual(claimed2.id, log2.id)

        # Empty queue check
        claimed3 = job_queue.claim_next_job(worker_id="worker-3")
        self.assertIsNone(claimed3)

    def test_stale_lease_recovery(self):
        """Verify stale processing jobs (> 90s) are automatically reclaimed with fresh lease tokens."""
        now = timezone.now()
        old_token = uuid.uuid4()
        stale_log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='dinner',
            image_url=self.image_path,
            status=AICalorieLog.Status.PROCESSING,
            claimed_by="crashed-worker",
            claimed_at=now - timedelta(seconds=100),
            lease_token=old_token,
            retry_count=1
        )

        reclaimed = job_queue.claim_next_job(worker_id="recovery-worker", lease_timeout_seconds=90)
        self.assertIsNotNone(reclaimed)
        self.assertEqual(reclaimed.id, stale_log.id)
        self.assertEqual(reclaimed.claimed_by, "recovery-worker")
        self.assertEqual(reclaimed.retry_count, 2)
        self.assertNotEqual(reclaimed.lease_token, old_token)

    def test_backoff_schedule_available_at(self):
        """Verify 5s/20s/60s backoff via available_at prevents premature claiming."""
        now = timezone.now()
        log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='lunch',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )

        # Claim 1st attempt
        job1 = job_queue.claim_next_job(worker_id="worker-1")
        self.assertEqual(job1.retry_count, 1)

        # Fail attempt 1 with retryable=True -> backoff 5s
        job_queue.fail_job(
            job_id=job1.id,
            lease_token=job1.lease_token,
            error_code=AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE,
            error_message="Network glitch",
            retryable=True
        )

        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.QUEUED)
        self.assertIsNotNone(log.available_at)
        self.assertGreater(log.available_at, now)

        # Attempt claim immediately -> should be None because available_at is in the future
        early_claim = job_queue.claim_next_job(worker_id="worker-2")
        self.assertIsNone(early_claim)

        # Fast-forward available_at to the past -> now claimable
        AICalorieLog.objects.filter(id=log.id).update(available_at=now - timedelta(seconds=1))
        job2 = job_queue.claim_next_job(worker_id="worker-2")
        self.assertIsNotNone(job2)
        self.assertEqual(job2.retry_count, 2)

        # Fail attempt 2 -> backoff 20s
        job_queue.fail_job(
            job_id=job2.id,
            lease_token=job2.lease_token,
            error_code=AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE,
            error_message="Network glitch 2",
            retryable=True
        )
        log.refresh_from_db()
        # Ensure available_at was set around +20s
        self.assertGreater(log.available_at, now + timedelta(seconds=15))

    def test_max_retry_attempts_exceeded(self):
        """Verify jobs exceeding max attempts are marked FAILED when claimed."""
        now = timezone.now()
        dead_log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='snack',
            image_url=self.image_path,
            status=AICalorieLog.Status.PROCESSING,
            claimed_by="crashed-worker",
            claimed_at=now - timedelta(seconds=200),
            retry_count=3  # AI_JOB_MAX_ATTEMPTS = 3
        )

        claimed = job_queue.claim_next_job(worker_id="worker-1", max_attempts=3)
        self.assertIsNone(claimed)

        dead_log.refresh_from_db()
        self.assertEqual(dead_log.status, AICalorieLog.Status.FAILED)
        self.assertEqual(dead_log.error_code, AICalorieLog.ErrorCode.WORKER_CRASHED)
        self.assertIn("maximum retry attempts", dead_log.error_message)

    def test_max_queue_age_exceeded(self):
        """Verify jobs older than max age (180s) are failed upon claim."""
        now = timezone.now()
        expired_log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='snack',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )
        AICalorieLog.objects.filter(id=expired_log.id).update(logged_at=now - timedelta(seconds=200))

        claimed = job_queue.claim_next_job(worker_id="worker-1", max_age_seconds=180)
        self.assertIsNone(claimed)

        expired_log.refresh_from_db()
        self.assertEqual(expired_log.status, AICalorieLog.Status.FAILED)
        self.assertEqual(expired_log.error_code, AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT)

    def test_lease_token_fencing_complete_job(self):
        """Verify complete_job rejects mismatched lease tokens (fencing)."""
        log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='lunch',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )
        claimed = job_queue.claim_next_job(worker_id="worker-1")
        valid_token = claimed.lease_token
        bogus_token = uuid.uuid4()

        # Attempt complete with invalid token -> 0 rows updated
        success_fake = job_queue.complete_job(
            job_id=claimed.id,
            lease_token=bogus_token,
            raw_prediction={"num_ingredients": 1},
            total_calories=200.0
        )
        self.assertFalse(success_fake)
        claimed.refresh_from_db()
        self.assertEqual(claimed.status, AICalorieLog.Status.PROCESSING)

        # Attempt complete with valid token
        success_valid = job_queue.complete_job(
            job_id=claimed.id,
            lease_token=valid_token,
            raw_prediction={"num_ingredients": 1, "ingredients": [{"ingredient": "apple"}]},
            total_calories=95.0,
            total_carbs=25.0,
            total_protein=0.5,
            total_fats=0.3
        )
        self.assertTrue(success_valid)
        claimed.refresh_from_db()
        self.assertEqual(claimed.status, AICalorieLog.Status.PENDING_USER_REVIEW)
        self.assertEqual(claimed.total_calories, 95.0)

    def test_rls_non_superuser_claim_and_finalize(self):
        """Verify worker claims and finalizes under non-superuser role with RLS active."""
        if connection.vendor != 'postgresql':
            self.skipTest("Requires PostgreSQL for RLS context verification")

        log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='dinner',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL ROLE nutriplatform_app;")

            # Worker claims as system worker
            claimed = job_queue.claim_next_job(worker_id="rls-worker")
            self.assertIsNotNone(claimed)
            self.assertEqual(claimed.id, log.id)

            # Worker finalizes job -> updates under owner context
            success = job_queue.complete_job(
                job_id=claimed.id,
                lease_token=claimed.lease_token,
                raw_prediction={"num_ingredients": 1},
                total_calories=500.0
            )
            self.assertTrue(success)

            log.refresh_from_db()
            self.assertEqual(log.status, AICalorieLog.Status.PENDING_USER_REVIEW)
            self.assertEqual(log.total_calories, 500.0)


class AIProcessorAndWorkerCommandTests(TestCase):
    """Tests for ai_processor.py execution, transaction isolation, and run_ai_worker."""

    def setUp(self):
        self.user = User.objects.create_user(email="processor_test@example.com", username="proc_test", role="client")
        self.client = Client.objects.create(user=self.user, is_premium=True)

        img_buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='red').save(img_buf, format='JPEG')
        self.image_path = default_storage.save(
            f'ai_logs/original/{self.client.client_id}/meal.jpg',
            ContentFile(img_buf.getvalue())
        )

    def tearDown(self):
        if default_storage.exists(self.image_path):
            default_storage.delete(self.image_path)

    @patch('client.ai_processor.call_ai_service')
    def test_503_overloaded_retry_after_no_attempt_spent(self, mock_ai_service):
        """Verify 503 overloaded response requeues with Retry-After without spending an attempt (item 3c)."""
        mock_ai_service.side_effect = ai_processor.AIServiceOverloadedError(
            "Service Overloaded",
            retry_after=12
        )

        log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='lunch',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )
        job = job_queue.claim_next_job(worker_id="test-worker")
        self.assertEqual(job.retry_count, 1)

        success = ai_processor.process_calorie_job(job)
        self.assertFalse(success)

        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.QUEUED)
        self.assertEqual(log.retry_count, 0, "503 backpressure must NOT spend an attempt")
        self.assertIsNotNone(log.available_at)
        self.assertGreater(log.available_at, timezone.now() + timedelta(seconds=5))

    @patch('client.ai_processor.call_ai_service')
    def test_500_inference_error_is_retryable(self, mock_ai_service):
        """Verify AI 500 error is treated as transient / retryable (item 4)."""
        mock_ai_service.side_effect = ai_processor.AIServiceInferenceError("500 Internal Server Error (CUDA OOM transient)")

        log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='lunch',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )
        job = job_queue.claim_next_job(worker_id="test-worker")
        success = ai_processor.process_calorie_job(job)

        self.assertFalse(success)
        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.QUEUED)
        self.assertEqual(log.error_code, AICalorieLog.ErrorCode.AI_INFERENCE_ERROR)
        self.assertEqual(log.retry_count, 1)

    @patch('client.ai_processor.call_ai_service')
    def test_process_calorie_job_non_retryable_client_error(self, mock_ai_service):
        """Verify 4xx client errors immediately fail the job without retrying."""
        mock_ai_service.side_effect = ai_processor.AIServiceClientError("400 Bad Request: Image corrupt")

        log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='lunch',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )
        job = job_queue.claim_next_job(worker_id="test-worker")
        success = ai_processor.process_calorie_job(job)

        self.assertFalse(success)
        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.FAILED)
        self.assertEqual(log.error_code, AICalorieLog.ErrorCode.IMAGE_INVALID)

    @patch('client.ai_processor.call_ai_service')
    def test_run_ai_worker_command_once(self, mock_ai_service):
        """Verify manage.py run_ai_worker --once processes queued jobs and terminates."""
        mock_ai_service.return_value = {
            "num_ingredients": 1,
            "ingredients": [{"ingredient": "banana", "estimated_mass_g": 118, "confidence": 0.99}],
            "nutrition": {"items": [{"name": "banana", "calories": 105.0, "protein_g": 1.3, "carbohydrates_total_g": 27.0, "fat_total_g": 0.3}]},
            "visual": None
        }

        log = AICalorieLog.objects.create(
            client=self.client,
            meal_type='snack',
            image_url=self.image_path,
            status=AICalorieLog.Status.QUEUED,
        )

        out = io.StringIO()
        call_command('run_ai_worker', once=True, poll_interval=0.1, stdout=out)

        output_str = out.getvalue()
        self.assertIn("AI Calorie Worker started", output_str)
        self.assertIn(f"Processing job #{log.id}", output_str)
        self.assertIn("processed successfully", output_str)

        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.PENDING_USER_REVIEW)
        self.assertEqual(log.total_calories, 105.0)

    @patch('client.job_queue.claim_next_job')
    def test_run_ai_worker_graceful_shutdown_on_signal(self, mock_claim):
        """Verify worker gracefully stops processing when a shutdown signal is raised."""
        from client.management.commands.run_ai_worker import Command as WorkerCmd

        cmd = WorkerCmd()
        out = io.StringIO()
        cmd.stdout = out

        # Setup mock to simulate receiving signal after first poll
        call_count = 0
        def fake_claim(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                cmd.should_stop = True
            return None

        mock_claim.side_effect = fake_claim
        cmd.handle(poll_interval=0.01)

        self.assertTrue(cmd.should_stop)
        self.assertEqual(call_count, 1)
        self.assertIn("Worker stopped gracefully", out.getvalue())



class ConcurrentClaimTransactionTests(TransactionTestCase):
    """Multi-threaded / transaction-level concurrency test for SKIP LOCKED."""

    def setUp(self):
        self.user = User.objects.create_user(email="concurrent@example.com", username="concurrent", role="client")
        self.client = Client.objects.create(user=self.user, is_premium=True)

    def test_concurrent_worker_claims_no_duplicates(self):
        """Verify two concurrent claim calls on 2 queued jobs claim distinct jobs with 0 collisions."""
        import concurrent.futures

        log1 = AICalorieLog.objects.create(
            client=self.client,
            meal_type='breakfast',
            status=AICalorieLog.Status.QUEUED,
        )
        log2 = AICalorieLog.objects.create(
            client=self.client,
            meal_type='lunch',
            status=AICalorieLog.Status.QUEUED,
        )

        claimed_ids = []

        def worker_claim_task(worker_name):
            from django.db import connection
            connection.close()  # Ensure fresh DB connection per thread
            try:
                job = job_queue.claim_next_job(worker_id=worker_name)
                return job.id if job else None
            finally:
                connection.close()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            futures = [
                executor.submit(worker_claim_task, "worker-thread-1"),
                executor.submit(worker_claim_task, "worker-thread-2"),
            ]
            for f in concurrent.futures.as_completed(futures):
                res = f.result()
                if res:
                    claimed_ids.append(res)

        # Exactly 2 distinct jobs claimed
        self.assertEqual(len(claimed_ids), 2)
        self.assertEqual(set(claimed_ids), {log1.id, log2.id})

    @patch('client.ai_processor.call_ai_service')
    def test_no_database_transaction_held_during_ai_call(self, mock_ai_service):
        """Verify that no database transaction is held open during the AI HTTP call (item 3a)."""
        img_buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='purple').save(img_buf, format='JPEG')
        image_path = default_storage.save(
            f'ai_logs/original/{self.client.client_id}/test_txn.jpg',
            ContentFile(img_buf.getvalue())
        )

        was_in_atomic_block = []
        db_states = []

        def side_effect_check_transaction(*args, **kwargs):
            was_in_atomic_block.append(connection.in_atomic_block)
            if connection.vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("SELECT state FROM pg_stat_activity WHERE pid = pg_backend_pid();")
                    row = cursor.fetchone()
                    db_states.append(row[0] if row else None)
            return {
                "num_ingredients": 1,
                "ingredients": [{"ingredient": "steak", "estimated_mass_g": 200}],
                "nutrition": {"items": [{"name": "steak", "calories": 400.0}]},
                "visual": None
            }

        mock_ai_service.side_effect = side_effect_check_transaction

        try:
            log = AICalorieLog.objects.create(
                client=self.client,
                meal_type='dinner',
                image_url=image_path,
                status=AICalorieLog.Status.QUEUED,
            )
            job = job_queue.claim_next_job(worker_id="test-worker")
            success = ai_processor.process_calorie_job(job)

            self.assertTrue(success)
            self.assertEqual(len(was_in_atomic_block), 1)
            self.assertFalse(was_in_atomic_block[0], "Database transaction MUST NOT be held during AI HTTP call")
            if db_states:
                self.assertNotEqual(db_states[0], "idle in transaction", "Worker connection MUST NOT be idle in transaction during AI call")
        finally:
            if default_storage.exists(image_path):
                default_storage.delete(image_path)


class AIPipelineSystemChecksTests(TestCase):
    """Unit tests verifying Django system checks E001-E005 and W002."""

    def test_e001_lease_less_than_worst_case(self):
        from client.apps import check_ai_pipeline_settings
        with self.settings(AI_JOB_LEASE_TIMEOUT_SECONDS=30, AI_SERVICE_HTTP_TIMEOUT=60):
            errors = check_ai_pipeline_settings(None)
            error_ids = [e.id for e in errors]
            self.assertIn("client.E001", error_ids)

    def test_e002_max_attempts_zero(self):
        from client.apps import check_ai_pipeline_settings
        with self.settings(AI_JOB_MAX_ATTEMPTS=0):
            errors = check_ai_pipeline_settings(None)
            error_ids = [e.id for e in errors]
            self.assertIn("client.E002", error_ids)

    def test_e003_max_age_less_than_or_equal_to_lease(self):
        from client.apps import check_ai_pipeline_settings
        with self.settings(AI_JOB_MAX_AGE_SECONDS=100, AI_JOB_LEASE_TIMEOUT_SECONDS=120):
            errors = check_ai_pipeline_settings(None)
            error_ids = [e.id for e in errors]
            self.assertIn("client.E003", error_ids)

    def test_e004_backoff_schedule_insufficient_length(self):
        from client.apps import check_ai_pipeline_settings
        with self.settings(AI_JOB_MAX_ATTEMPTS=4, AI_JOB_BACKOFF_SCHEDULE=[5, 20]):
            errors = check_ai_pipeline_settings(None)
            error_ids = [e.id for e in errors]
            self.assertIn("client.E004", error_ids)

    def test_e005_queue_cap_cannot_drain_before_deadline(self):
        from client.apps import check_ai_pipeline_settings
        with self.settings(AI_GLOBAL_QUEUE_CAP=100, AI_ETA_SECONDS_PER_JOB=3, AI_JOB_MAX_AGE_SECONDS=180):
            errors = check_ai_pipeline_settings(None)
            error_ids = [e.id for e in errors]
            self.assertIn("client.E005", error_ids)

    def test_w002_inline_mode_without_sufficient_gunicorn_timeout(self):
        import os
        from client.apps import check_ai_pipeline_settings
        old_env = os.environ.get("GUNICORN_TIMEOUT")
        try:
            os.environ["GUNICORN_TIMEOUT"] = "30"
            with self.settings(AI_ASYNC_PIPELINE=False):
                errors = check_ai_pipeline_settings(None)
                error_ids = [e.id for e in errors]
                self.assertIn("client.W002", error_ids)
        finally:
            if old_env is not None:
                os.environ["GUNICORN_TIMEOUT"] = old_env
            else:
                os.environ.pop("GUNICORN_TIMEOUT", None)

