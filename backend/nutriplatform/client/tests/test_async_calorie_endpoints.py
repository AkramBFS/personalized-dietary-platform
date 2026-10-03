import io
import uuid
from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from client import job_queue, ai_processor
from client.models import Client, AICalorieLog, DailyProgressMetric, PremiumSubscription
from users.models import User


class AICalorieEndpointsTests(TestCase):
    """Integration tests for Step 5 AI Calorie Tracker endpoints and abuse controls."""

    def setUp(self):
        self.client_api = APIClient()

        # Create primary client user with active premium subscription
        self.user = User.objects.create_user(
            email="client_endpoint@example.com",
            username="client_endpoint",
            role="client"
        )
        self.client_profile = Client.objects.create(user=self.user, is_premium=True)
        PremiumSubscription.objects.create(
            client=self.client_profile,
            status='active',
            end_date=timezone.now() + timedelta(days=30),
            transaction_number=uuid.uuid4().hex
        )
        self.client_api.force_authenticate(user=self.user)

        # Create secondary client user for isolation tests
        self.user2 = User.objects.create_user(
            email="other_client@example.com",
            username="other_client",
            role="client"
        )
        self.client_profile2 = Client.objects.create(user=self.user2, is_premium=True)
        PremiumSubscription.objects.create(
            client=self.client_profile2,
            status='active',
            end_date=timezone.now() + timedelta(days=30),
            transaction_number=uuid.uuid4().hex
        )

        # Generate sample JPEG image for upload
        img_buf = io.BytesIO()
        Image.new('RGB', (200, 200), color='orange').save(img_buf, format='JPEG')
        self.sample_image_bytes = img_buf.getvalue()

    def _create_upload_file(self, filename="meal.jpg"):
        return SimpleUploadedFile(
            filename,
            self.sample_image_bytes,
            content_type="image/jpeg"
        )

    def test_submit_success_async_202(self):
        """Verify successful async submission returns 202 Accepted with queue details."""
        upload = self._create_upload_file()
        response = self.client_api.post(
            '/api/v1/client/calorie-tracker/ai/',
            {'image': upload, 'meal_type': 'lunch'},
            format='multipart'
        )

        self.assertEqual(response.status_code, 202)
        data = response.data['data']
        self.assertEqual(data['status'], 'queued')
        self.assertEqual(data['meal_type'], 'lunch')
        self.assertEqual(data['queue_position'], 1)
        self.assertGreater(data['eta_seconds'], 0)
        self.assertEqual(data['poll_after_ms'], 1000)

        # Verify DB record
        log = AICalorieLog.objects.get(id=data['log_id'])
        self.assertEqual(log.status, AICalorieLog.Status.QUEUED)
        self.assertEqual(log.client, self.client_profile)
        self.assertTrue(default_storage.exists(log.image_url))

    def test_submit_inflight_lock_409(self):
        """Verify client cannot submit a second job while one is queued or processing (in-flight lock)."""
        # Create existing in-flight job
        existing_log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='breakfast',
            image_url='ai_logs/dummy.jpg',
            status=AICalorieLog.Status.QUEUED
        )

        upload = self._create_upload_file()
        response = self.client_api.post(
            '/api/v1/client/calorie-tracker/ai/',
            {'image': upload, 'meal_type': 'lunch'},
            format='multipart'
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data['code'], 'IN_FLIGHT_JOB_EXISTS')
        self.assertEqual(response.data['active_job_id'], existing_log.id)

    def test_submit_rolling_daily_quota_429(self):
        """Verify rolling 24-hour quota enforcement rejects when limit is reached."""
        now = timezone.now()
        # Seed 30 finished logs in the last 24h
        for i in range(30):
            AICalorieLog.objects.create(
                client=self.client_profile,
                meal_type='lunch',
                image_url='ai_logs/dummy.jpg',
                status=AICalorieLog.Status.SAVED,
                logged_at=now - timedelta(hours=i * 0.5)
            )

        upload = self._create_upload_file()
        with override_settings(AI_MAX_DAILY_PER_USER=30):
            response = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload, 'meal_type': 'lunch'},
                format='multipart'
            )

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.data['code'], 'DAILY_QUOTA_EXCEEDED')
        self.assertIn('resets_at', response.data)

    def test_submit_global_queue_cap_503(self):
        """Verify global queue cap returns 503 with Retry-After when platform queue is saturated."""
        # Seed 5 in-flight jobs across other clients
        for i in range(5):
            AICalorieLog.objects.create(
                client=self.client_profile2,
                meal_type='dinner',
                image_url='ai_logs/dummy.jpg',
                status=AICalorieLog.Status.QUEUED
            )

        upload = self._create_upload_file()
        with override_settings(AI_GLOBAL_QUEUE_CAP=5):
            response = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload, 'meal_type': 'lunch'},
                format='multipart'
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data['code'], 'SYSTEM_BUSY')
        self.assertEqual(response.data['retry_after'], 5)

    def test_status_endpoint_returns_data(self):
        """Verify status endpoint returns full prediction and preview details."""
        raw_pred = {
            "num_ingredients": 2,
            "predictions": [
                {"label": "rice", "mass_grams": 150.0, "confidence": 0.95},
                {"label": "chicken", "mass_grams": 100.0, "confidence": 0.90}
            ]
        }
        log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='dinner',
            image_url='ai_logs/dummy.jpg',
            segmented_image_url='ai_logs/segmented/dummy.jpg',
            ai_raw_prediction=raw_pred,
            total_calories=420.0,
            total_protein=35.0,
            total_carbs=45.0,
            total_fats=8.0,
            status=AICalorieLog.Status.PENDING_USER_REVIEW
        )

        response = self.client_api.get(f'/api/v1/client/calorie-tracker/ai/{log.id}/status/')
        self.assertEqual(response.status_code, 200)
        data = response.data['data']
        self.assertEqual(data['status'], 'pending_user_review')
        self.assertEqual(data['nutrition_preview']['total_calories'], 420.0)
        self.assertEqual(len(data['predictions']), 2)
        self.assertEqual(data['overlay_url'], f'/api/v1/client/calorie-tracker/ai/{log.id}/overlay/')

    def test_status_endpoint_conditional_deadline_timeout_and_race_prevention(self):
        """Verify read-time conditional deadline marks 180s expired job FAILED and prevents late worker overwrite."""
        now = timezone.now()
        log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='lunch',
            image_url='ai_logs/dummy.jpg',
            status=AICalorieLog.Status.QUEUED,
        )
        AICalorieLog.objects.filter(id=log.id).update(logged_at=now - timedelta(seconds=200))

        # 1. User GETs status -> conditionally transitions to FAILED (AI_INFERENCE_TIMEOUT)
        response = self.client_api.get(f'/api/v1/client/calorie-tracker/ai/{log.id}/status/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['status'], 'failed')
        self.assertEqual(response.data['data']['error_code'], AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT)

        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.FAILED)

        # 2. Race condition test: Late worker attempts complete_job with a previously assigned lease token
        late_lease_token = uuid.uuid4()
        success = job_queue.complete_job(
            job_id=log.id,
            lease_token=late_lease_token,
            raw_prediction={"predictions": []},
            total_calories=500.0
        )
        # Must return False and refuse to resurrect the timed-out job
        self.assertFalse(success)
        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.FAILED)

    def test_active_endpoint(self):
        """Verify active endpoint returns current in-flight job or null."""
        # 1. When no active job exists
        res_empty = self.client_api.get('/api/v1/client/calorie-tracker/ai/active/')
        self.assertEqual(res_empty.status_code, 200)
        self.assertIsNone(res_empty.data['data'])

        # 2. When active in-flight job exists
        log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='breakfast',
            image_url='ai_logs/dummy.jpg',
            status=AICalorieLog.Status.QUEUED
        )
        res_active = self.client_api.get('/api/v1/client/calorie-tracker/ai/active/')
        self.assertEqual(res_active.status_code, 200)
        self.assertIsNotNone(res_active.data['data'])
        self.assertEqual(res_active.data['data']['log_id'], log.id)
        self.assertEqual(res_active.data['data']['status'], 'queued')

    def test_discard_and_cancel_endpoints(self):
        """Verify discarding / cancelling queued and reviewable jobs."""
        # Cancel queued job
        queued_log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='lunch',
            status=AICalorieLog.Status.QUEUED
        )
        res_cancel = self.client_api.post(f'/api/v1/client/calorie-tracker/ai/{queued_log.id}/cancel/')
        self.assertEqual(res_cancel.status_code, 200)
        queued_log.refresh_from_db()
        self.assertEqual(queued_log.status, AICalorieLog.Status.CANCELLED)

        # Discard pending_user_review job
        review_log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='dinner',
            status=AICalorieLog.Status.PENDING_USER_REVIEW
        )
        res_discard = self.client_api.post(f'/api/v1/client/calorie-tracker/ai/{review_log.id}/discard/')
        self.assertEqual(res_discard.status_code, 200)
        review_log.refresh_from_db()
        self.assertEqual(review_log.status, AICalorieLog.Status.DISCARDED)

    @patch('client.apiNinja.get_nutrition_data')
    def test_confirm_endpoint_idempotency(self, mock_nutrition):
        """Verify confirm transitions to saved and second confirm is idempotent without duplicate metrics."""
        mock_nutrition.return_value = {
            'total_calories': 500.0,
            'total_protein': 40.0,
            'total_carbs': 50.0,
            'total_fats': 15.0
        }

        log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='dinner',
            status=AICalorieLog.Status.PENDING_USER_REVIEW
        )

        payload = {
            "meal_type": "dinner",
            "user_final_log": [
                {"name": "rice", "mass_grams": 150.0},
                {"name": "beef", "mass_grams": 150.0}
            ]
        }

        # 1st Confirm
        res1 = self.client_api.post(f'/api/v1/client/calorie-tracker/ai/{log.id}/confirm/', payload, format='json')
        self.assertEqual(res1.status_code, 200)
        log.refresh_from_db()
        self.assertEqual(log.status, AICalorieLog.Status.SAVED)
        self.assertEqual(log.total_calories, 500.0)

        metric = DailyProgressMetric.objects.get(client=self.client_profile, log_date=timezone.now().date())
        self.assertEqual(metric.total_calories_consumed, 500.0)

        # 2nd Confirm (Idempotency)
        res2 = self.client_api.post(f'/api/v1/client/calorie-tracker/ai/{log.id}/confirm/', payload, format='json')
        self.assertEqual(res2.status_code, 200)
        self.assertIn("already confirmed", res2.data.get('message', ''))

        # Metrics must NOT double-increment
        metric.refresh_from_db()
        self.assertEqual(metric.total_calories_consumed, 500.0)

    def test_overlay_endpoint_owner_only(self):
        """Verify overlay endpoint streams image for owner and returns 403 for other clients."""
        # Save sample overlay image in storage
        img_buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='green').save(img_buf, format='JPEG')
        overlay_path = default_storage.save(
            f'ai_logs/segmented/{self.client_profile.client_id}/test_overlay.jpg',
            ContentFile(img_buf.getvalue())
        )

        log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='dinner',
            segmented_image_url=overlay_path,
            status=AICalorieLog.Status.PENDING_USER_REVIEW
        )

        try:
            # 1. Owner requests overlay -> 200 with image/jpeg
            res_owner = self.client_api.get(f'/api/v1/client/calorie-tracker/ai/{log.id}/overlay/')
            self.assertEqual(res_owner.status_code, 200)
            self.assertEqual(res_owner['Content-Type'], 'image/jpeg')

            # 2. Other client requests overlay -> 403 Forbidden
            other_api = APIClient()
            other_api.force_authenticate(user=self.user2)
            res_other = other_api.get(f'/api/v1/client/calorie-tracker/ai/{log.id}/overlay/')
            self.assertEqual(res_other.status_code, 403)
        finally:
            if default_storage.exists(overlay_path):
                default_storage.delete(overlay_path)

    @patch('client.ai_processor.call_ai_service')
    def test_rollback_flag_inline_execution(self, mock_ai_service):
        """Verify AI_ASYNC_PIPELINE=False runs process_calorie_job inline in the request."""
        mock_ai_service.return_value = {
            "num_ingredients": 1,
            "ingredients": [{"ingredient": "salmon", "estimated_mass_g": 180, "confidence": 0.98}],
            "nutrition": {"items": [{"name": "salmon", "calories": 360.0, "protein_g": 38.0, "carbohydrates_total_g": 0.0, "fat_total_g": 22.0}]},
            "visual": None
        }

        upload = self._create_upload_file()
        with override_settings(AI_ASYNC_PIPELINE=False):
            response = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload, 'meal_type': 'dinner'},
                format='multipart'
            )

        self.assertEqual(response.status_code, 202)
        data = response.data['data']
        self.assertEqual(data['status'], 'pending_user_review')
        self.assertEqual(data['nutrition_preview']['total_calories'], 360.0)

        log = AICalorieLog.objects.get(id=data['log_id'])
        self.assertEqual(log.status, AICalorieLog.Status.PENDING_USER_REVIEW)
        self.assertEqual(log.total_calories, 360.0)

    def test_web_request_cannot_obtain_system_worker_rls_flag(self):
        """Verify web request lifecycle forces app.is_system_worker = 'false' preventing privilege escalation."""
        if connection.vendor != 'postgresql':
            self.skipTest("Requires PostgreSQL for RLS session variable inspection")

        # Make authenticated request
        res = self.client_api.get('/api/v1/client/profile/')
        self.assertEqual(res.status_code, 200)

        # Inspect postgres session variable
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('app.is_system_worker', true);")
            worker_val = cursor.fetchone()[0]
            # Must be empty or 'false', NEVER 'true'
            self.assertIn(worker_val, ('', 'false', None))

    def test_elevated_context_reset_after_submit_and_status(self):
        """Verify elevated is_system_worker context is reset immediately after count checks."""
        if connection.vendor != 'postgresql':
            self.skipTest("Requires PostgreSQL for RLS context verification")

        upload = self._create_upload_file()
        res = self.client_api.post(
            '/api/v1/client/calorie-tracker/ai/',
            {'image': upload, 'meal_type': 'lunch'},
            format='multipart'
        )
        self.assertEqual(res.status_code, 202)

        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('app.is_system_worker', true);")
            worker_val = cursor.fetchone()[0]
            self.assertIn(worker_val, ('', 'false', None))

    def test_daily_quota_counts_user_errors_and_excludes_system_errors(self):
        """Verify quota excludes only system-caused errors (AI unavailable/timeout) and counts user errors."""
        now = timezone.now()
        # Seed 28 user-caused/saved logs (count against quota)
        for i in range(28):
            AICalorieLog.objects.create(
                client=self.client_profile,
                meal_type='lunch',
                image_url='ai_logs/dummy.jpg',
                status=AICalorieLog.Status.SAVED,
                logged_at=now - timedelta(hours=i * 0.5)
            )

        # Seed 1 user-caused failure (IMAGE_INVALID) -> counts against quota (total counted = 29)
        AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='lunch',
            image_url='ai_logs/dummy.jpg',
            status=AICalorieLog.Status.FAILED,
            error_code=AICalorieLog.ErrorCode.IMAGE_INVALID,
            logged_at=now - timedelta(hours=1)
        )

        # Seed 10 system-caused failures (AI_SERVICE_UNAVAILABLE, AI_INFERENCE_TIMEOUT, WORKER_CRASHED) -> EXCLUDED
        for i, code in enumerate([
            AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE,
            AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT,
            AICalorieLog.ErrorCode.WORKER_CRASHED,
        ] * 3):
            AICalorieLog.objects.create(
                client=self.client_profile,
                meal_type='lunch',
                image_url='ai_logs/dummy.jpg',
                status=AICalorieLog.Status.FAILED,
                error_code=code,
                logged_at=now - timedelta(hours=i * 0.2)
            )

        with override_settings(AI_MAX_DAILY_PER_USER=30):
            # 29 counted < 30 max -> 1 submission allowed
            upload1 = self._create_upload_file()
            res1 = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload1, 'meal_type': 'lunch'},
                format='multipart'
            )
            self.assertEqual(res1.status_code, 202)

            # Mark 30th job completed/saved to allow evaluating next submission against quota
            AICalorieLog.objects.filter(id=res1.data['data']['log_id']).update(status=AICalorieLog.Status.SAVED)

            # 30 counted == 30 max -> Next submission rejected with 429
            upload2 = self._create_upload_file()
            res2 = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload2, 'meal_type': 'lunch'},
                format='multipart'
            )
            self.assertEqual(res2.status_code, 429)
            self.assertEqual(res2.data['code'], 'DAILY_QUOTA_EXCEEDED')

    def test_burst_throttle_fails_open_on_cache_error(self):
        """Verify burst throttle fails open if cache backend raises an error."""
        with patch('rest_framework.throttling.UserRateThrottle.allow_request', side_effect=Exception("Cache down")):
            upload = self._create_upload_file()
            response = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload, 'meal_type': 'dinner'},
                format='multipart'
            )
            self.assertEqual(response.status_code, 202)

    def test_overlay_strictly_owner_only_rejects_staff(self):
        """Verify overlay endpoint rejects staff users if they are not the meal photo owner."""
        # Create staff user
        staff_user = User.objects.create_user(
            username="staff_member",
            email="staff@nutriplatform.com",
            password="Password123!",
            is_staff=True
        )

        img_buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='blue').save(img_buf, format='JPEG')
        overlay_path = default_storage.save(
            f'ai_logs/segmented/{self.client_profile.client_id}/staff_test.jpg',
            ContentFile(img_buf.getvalue())
        )

        log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='dinner',
            segmented_image_url=overlay_path,
            status=AICalorieLog.Status.PENDING_USER_REVIEW
        )

        try:
            staff_api = APIClient()
            staff_api.force_authenticate(user=staff_user)
            res = staff_api.get(f'/api/v1/client/calorie-tracker/ai/{log.id}/overlay/')
            # Strictly owner-only: staff gets 403
            self.assertEqual(res.status_code, 403)
        finally:
            if default_storage.exists(overlay_path):
                default_storage.delete(overlay_path)


from django.test import TransactionTestCase


class ConcurrentAICalorieSubmitTests(TransactionTestCase):
    """TransactionTestCase for verifying multi-threaded concurrent submission serialization."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="concurrent_client@example.com",
            username="concurrent_client",
            role="client"
        )
        self.client_profile = Client.objects.create(user=self.user, is_premium=True)
        PremiumSubscription.objects.create(
            client=self.client_profile,
            status='active',
            end_date=timezone.now() + timedelta(days=30),
            transaction_number=uuid.uuid4().hex
        )
        img_buf = io.BytesIO()
        Image.new('RGB', (200, 200), color='orange').save(img_buf, format='JPEG')
        self.sample_image_bytes = img_buf.getvalue()

    def _create_upload_file(self, filename="meal.jpg"):
        return SimpleUploadedFile(
            filename,
            self.sample_image_bytes,
            content_type="image/jpeg"
        )

    def test_concurrent_double_submit_row_locking(self):
        """Verify row locking serializes concurrent submissions and rejects duplicates with 409."""
        import threading
        from django.db import connection as thread_conn

        results = []
        errors = []

        def submit():
            try:
                thread_api = APIClient()
                thread_api.force_authenticate(user=self.user)
                upload = self._create_upload_file()
                res = thread_api.post(
                    '/api/v1/client/calorie-tracker/ai/',
                    {'image': upload, 'meal_type': 'lunch'},
                    format='multipart'
                )
                results.append(res.status_code)
            except Exception as e:
                errors.append(e)
            finally:
                thread_conn.close()

        t1 = threading.Thread(target=submit)
        t2 = threading.Thread(target=submit)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(len(errors), 0)
        self.assertIn(202, results)
        self.assertIn(409, results)


class AbuseLimitsSettingsTests(TestCase):
    """Integration tests verifying that all abuse limits are dynamically read from settings."""

    def setUp(self):
        self.client_api = APIClient()
        self.user = User.objects.create_user(
            email="settings_client@example.com",
            username="settings_client",
            role="client"
        )
        self.client_profile = Client.objects.create(user=self.user, is_premium=True)
        PremiumSubscription.objects.create(
            client=self.client_profile,
            status='active',
            end_date=timezone.now() + timedelta(days=30),
            transaction_number=uuid.uuid4().hex
        )
        self.client_api.force_authenticate(user=self.user)

        img_buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='green').save(img_buf, format='JPEG')
        self.sample_image_bytes = img_buf.getvalue()

    def _create_upload_file(self, filename="meal.jpg"):
        return SimpleUploadedFile(filename, self.sample_image_bytes, content_type="image/jpeg")

    def test_daily_quota_limit_dynamically_read_from_settings(self):
        """Verify AI_DAILY_QUOTA_LIMIT setting dynamically adjusts maximum daily submissions."""
        with self.settings(AI_MAX_DAILY_PER_USER=2, AI_DAILY_QUOTA_LIMIT=2):
            now = timezone.now()
            AICalorieLog.objects.create(client=self.client_profile, meal_type='breakfast', status=AICalorieLog.Status.SAVED, logged_at=now, image_url='dummy1.jpg')
            AICalorieLog.objects.create(client=self.client_profile, meal_type='lunch', status=AICalorieLog.Status.SAVED, logged_at=now, image_url='dummy2.jpg')

            # 3rd submission rejected with 429
            upload = self._create_upload_file()
            res = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload, 'meal_type': 'dinner'},
                format='multipart'
            )
            self.assertEqual(res.status_code, 429)
            self.assertEqual(res.data['code'], 'DAILY_QUOTA_EXCEEDED')

    def test_in_flight_limit_dynamically_read_from_settings(self):
        """Verify AI_IN_FLIGHT_JOB_LIMIT setting dynamically adjusts in-flight concurrency."""
        with self.settings(AI_MAX_IN_FLIGHT_PER_USER=2, AI_IN_FLIGHT_JOB_LIMIT=2):
            # 1 in-flight job allowed when limit is 2
            AICalorieLog.objects.create(
                client=self.client_profile,
                meal_type='breakfast',
                image_url='ai_logs/dummy.jpg',
                status=AICalorieLog.Status.QUEUED
            )
            upload = self._create_upload_file()
            res1 = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload, 'meal_type': 'lunch'},
                format='multipart'
            )
            self.assertEqual(res1.status_code, 202)

            # Now 2 are in-flight -> 3rd submission rejected with 409
            upload2 = self._create_upload_file()
            res2 = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload2, 'meal_type': 'dinner'},
                format='multipart'
            )
            self.assertEqual(res2.status_code, 409)
            self.assertEqual(res2.data['code'], 'IN_FLIGHT_JOB_EXISTS')

    def test_global_queue_cap_dynamically_read_from_settings(self):
        """Verify AI_GLOBAL_QUEUE_CAP setting dynamically adjusts global admission threshold."""
        with self.settings(AI_GLOBAL_QUEUE_CAP=2):
            # Create 2 queued jobs globally for other clients
            other_user = User.objects.create_user(email="other@example.com", username="other_user", role="client")
            other_client = Client.objects.create(user=other_user, is_premium=True)
            AICalorieLog.objects.create(client=other_client, meal_type='breakfast', status=AICalorieLog.Status.QUEUED)
            AICalorieLog.objects.create(client=other_client, meal_type='lunch', status=AICalorieLog.Status.QUEUED)

            # Submission rejected with 503 SYSTEM_BUSY because queue is at cap (2)
            upload = self._create_upload_file()
            res = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload, 'meal_type': 'dinner'},
                format='multipart'
            )
            self.assertEqual(res.status_code, 503)
            self.assertEqual(res.data['code'], 'SYSTEM_BUSY')

    def test_burst_rate_limit_dynamically_read_from_settings(self):
        """Verify burst throttle rate is dynamically read from settings."""
        locmem_cache = {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'test_burst_cache',
            }
        }

        with self.settings(
            CACHES=locmem_cache,
            AI_BURST_PER_MINUTE_PER_USER=1,
            AI_BURST_RATE_LIMIT=1,
        ):
            from django.core.cache import cache
            cache.clear()

            upload1 = self._create_upload_file()
            res1 = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload1, 'meal_type': 'breakfast'},
                format='multipart'
            )
            self.assertEqual(res1.status_code, 202)

            # Immediately mark finished so in-flight check doesn't trigger
            AICalorieLog.objects.filter(id=res1.data['data']['log_id']).update(status=AICalorieLog.Status.SAVED)

            # 2nd request in same minute rejected with 429 burst throttle
            upload2 = self._create_upload_file()
            res2 = self.client_api.post(
                '/api/v1/client/calorie-tracker/ai/',
                {'image': upload2, 'meal_type': 'lunch'},
                format='multipart'
            )
            self.assertEqual(res2.status_code, 429)


class QueueHealthEndpointTests(TestCase):
    """
    Unit tests for staff-only AI queue health endpoint.
    """

    def setUp(self):
        self.staff_user = User.objects.create_user(
            email="staff@nutriplatform.com",
            username="staff_user",
            role="admin",
            is_staff=True
        )
        self.client_user = User.objects.create_user(
            email="client@nutriplatform.com",
            username="client_user",
            role="client"
        )
        self.client_profile = Client.objects.create(user=self.client_user, is_premium=True)

        self.staff_api = APIClient()
        self.staff_api.force_authenticate(user=self.staff_user)

        self.client_api = APIClient()
        self.client_api.force_authenticate(user=self.client_user)

        self.anon_api = APIClient()

    def test_queue_health_unauthenticated_rejected(self):
        """Verify unauthenticated requests return 401."""
        res = self.anon_api.get('/api/v1/client/calorie-tracker/ai/queue-health/')
        self.assertEqual(res.status_code, 401)

    def test_queue_health_non_staff_forbidden(self):
        """Verify non-staff client requests return 403."""
        res = self.client_api.get('/api/v1/client/calorie-tracker/ai/queue-health/')
        self.assertEqual(res.status_code, 403)

    def test_queue_health_staff_success_and_accurate_metrics(self):
        """Verify staff user receives 200 with queue metrics and health stats."""
        now = timezone.now()
        # Seed various job statuses
        job_queued = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='breakfast',
            status=AICalorieLog.Status.QUEUED
        )
        AICalorieLog.objects.filter(id=job_queued.id).update(logged_at=now - timedelta(seconds=25))
        AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='lunch',
            status=AICalorieLog.Status.PROCESSING,
            claimed_at=now - timedelta(seconds=120)  # stale lease (> 90s default)
        )
        AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type='dinner',
            status=AICalorieLog.Status.SAVED
        )

        res = self.staff_api.get('/api/v1/client/calorie-tracker/ai/queue-health/')
        self.assertEqual(res.status_code, 200)
        data = res.data['data']

        self.assertIn('queue', data)
        self.assertEqual(data['queue']['queued'], 1)
        self.assertEqual(data['queue']['processing'], 1)
        self.assertEqual(data['queue']['saved'], 1)
        self.assertEqual(data['queue']['stale_leases_count'], 1)
        self.assertGreaterEqual(data['queue']['oldest_queued_age_sec'], 20.0)

        self.assertIn('ai_service', data)
        self.assertIn('status', data['ai_service'])
        self.assertIn('timestamp', data)



