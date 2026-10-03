import io
import uuid
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection, transaction
from rest_framework.exceptions import ValidationError

from users.models import User
from client.models import Client, AICalorieLog
from utils.upload_security import validate_and_normalize_meal_image, validate_request_content_length
from nutriplatform.middleware.rls import set_rls_context, clear_rls_context


class ImageSanitizationAndNormalizationTests(TestCase):
    """Unit tests for shared upload security and normalization in utils/upload_security.py."""

    def test_valid_image_normalization_to_2048(self):
        """Verify meal image is normalized to JPEG up to 2048px max side."""
        buf = io.BytesIO()
        img = Image.new('RGB', (2400, 1800), color='green')
        img.save(buf, format='PNG')
        upload = SimpleUploadedFile("test_meal.png", buf.getvalue(), content_type="image/png")

        content_file, meta = validate_and_normalize_meal_image(upload)
        self.assertIsNotNone(content_file)
        self.assertEqual(meta['normalized_format'], 'JPEG')
        self.assertEqual(meta['original_format'], 'PNG')
        self.assertLessEqual(max(meta['width'], meta['height']), 2048)

    def test_decompression_bomb_rejection(self):
        """Verify oversized pixel count throws ValidationError (decompression bomb protection)."""
        buf = io.BytesIO()
        # 7000x7000 = 49M pixels > 40M limit
        img = Image.new('RGB', (7000, 7000), color='black')
        img.save(buf, format='JPEG')
        upload = SimpleUploadedFile("bomb.jpg", buf.getvalue(), content_type="image/jpeg")

        with self.assertRaises(ValidationError) as ctx:
            validate_and_normalize_meal_image(upload)
        self.assertIn("exceeds limit of 40000000 px", str(ctx.exception))

    def test_corrupt_file_rejection(self):
        """Verify non-image bytes throw ValidationError."""
        upload = SimpleUploadedFile("corrupt.jpg", b"not-an-image-data", content_type="image/jpeg")
        with self.assertRaises(ValidationError) as ctx:
            validate_and_normalize_meal_image(upload)
        self.assertTrue("not a valid image" in str(ctx.exception) or "Invalid image format" in str(ctx.exception))

    def test_empty_file_rejection(self):
        """Verify empty file throws ValidationError."""
        upload = SimpleUploadedFile("empty.jpg", b"", content_type="image/jpeg")
        with self.assertRaises(ValidationError) as ctx:
            validate_and_normalize_meal_image(upload)
        self.assertIn("empty", str(ctx.exception))

    def test_content_length_header_check(self):
        """Verify request Content-Length guard function."""
        class MockRequest:
            def __init__(self, length):
                self.META = {'CONTENT_LENGTH': str(length)}

        # Valid length: 5MB
        req_ok = MockRequest(5 * 1024 * 1024)
        validate_request_content_length(req_ok)  # Should not raise

        # Oversized length: 25MB (> 10MB limit)
        req_huge = MockRequest(25 * 1024 * 1024)
        with self.assertRaises(ValidationError):
            validate_request_content_length(req_huge)


class AICalorieLogJobStateTests(TestCase):
    """Unit tests for AICalorieLog queue execution and state transitions."""

    def setUp(self):
        self.user1 = User.objects.create_user(email="user1@example.com", username="user1", role="client")
        self.client1 = Client.objects.create(user=self.user1, is_premium=True)

        self.user2 = User.objects.create_user(email="user2@example.com", username="user2", role="client")
        self.client2 = Client.objects.create(user=self.user2, is_premium=True)

    def test_job_lifecycle_queued_processing_pending_review(self):
        """Verify queued -> processing -> pending_user_review transition path."""
        log = AICalorieLog.objects.create(
            client=self.client1,
            meal_type='lunch',
            image_url='ai_logs/input/test.jpg',
            status=AICalorieLog.Status.QUEUED
        )
        self.assertEqual(log.status, AICalorieLog.Status.QUEUED)
        self.assertFalse(log.claimed_by)

        # Transition to processing
        lease_token = uuid.uuid4()
        log.mark_processing(worker_id="worker-1:pid-100", lease_token=lease_token)
        self.assertEqual(log.status, AICalorieLog.Status.PROCESSING)
        self.assertEqual(log.claimed_by, "worker-1:pid-100")
        self.assertEqual(log.lease_token, lease_token)
        self.assertIsNotNone(log.claimed_at)

        # Transition to completed / pending_user_review
        raw_result = {"num_ingredients": 2, "ingredients": [{"ingredient": "rice", "estimated_mass_g": 150}]}
        log.mark_completed(
            raw_prediction=raw_result,
            segmented_image_url='ai_logs/segmented/test.jpg',
            total_calories=350.0,
            total_protein=15.0,
            total_carbs=60.0,
            total_fats=5.0
        )
        self.assertEqual(log.status, AICalorieLog.Status.PENDING_USER_REVIEW)
        self.assertEqual(log.ai_raw_prediction, raw_result)
        self.assertEqual(log.total_calories, 350.0)
        self.assertIsNotNone(log.completed_at)

    def test_job_failure_transition(self):
        """Verify queued -> processing -> failed transition."""
        log = AICalorieLog.objects.create(
            client=self.client1,
            meal_type='dinner',
            status=AICalorieLog.Status.QUEUED
        )
        log.mark_processing(worker_id="worker-1", lease_token=uuid.uuid4())
        log.mark_failed(
            error_code=AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE,
            error_message="FastAPI service returned 503"
        )
        self.assertEqual(log.status, AICalorieLog.Status.FAILED)
        self.assertEqual(log.error_code, AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE)
        self.assertIn("503", log.error_message)
        self.assertIsNotNone(log.completed_at)

    def test_job_cancellation(self):
        """Verify queued -> cancelled transition."""
        log = AICalorieLog.objects.create(
            client=self.client1,
            meal_type='breakfast',
            status=AICalorieLog.Status.QUEUED
        )
        log.mark_cancelled()
        self.assertEqual(log.status, AICalorieLog.Status.CANCELLED)
        self.assertEqual(log.error_code, AICalorieLog.ErrorCode.CANCELLED)

    def test_rls_isolation_between_clients(self):
        """Verify row-level security isolates AICalorieLog rows per client under nutriplatform_app."""
        if connection.vendor != 'postgresql':
            self.skipTest("RLS tests require PostgreSQL connection")

        log1 = AICalorieLog.objects.create(
            client=self.client1,
            meal_type='lunch',
            status=AICalorieLog.Status.QUEUED
        )
        log2 = AICalorieLog.objects.create(
            client=self.client2,
            meal_type='dinner',
            status=AICalorieLog.Status.QUEUED
        )

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL ROLE nutriplatform_app;")

            # Context: Client 1
            set_rls_context(self.user1)
            client1_logs = list(AICalorieLog.objects.all())
            self.assertEqual(len(client1_logs), 1)
            self.assertEqual(client1_logs[0].id, log1.id)

            # Context: Client 2
            set_rls_context(self.user2)
            client2_logs = list(AICalorieLog.objects.all())
            self.assertEqual(len(client2_logs), 1)
            self.assertEqual(client2_logs[0].id, log2.id)

            # Context: Worker with is_staff=True (admin context)
            admin_user = User.objects.create_user(
                username="worker_staff",
                email="worker_staff@example.com",
                role="admin",
                is_staff=True
            )
            set_rls_context(admin_user)
            staff_logs = list(AICalorieLog.objects.all())
            log_ids = {l.id for l in staff_logs}
            self.assertIn(log1.id, log_ids)
            self.assertIn(log2.id, log_ids)

            # Context: Unauthenticated anonymous
            clear_rls_context()
            anon_logs = list(AICalorieLog.objects.all())
            self.assertEqual(len(anon_logs), 0)
