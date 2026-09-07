from unittest.mock import patch, MagicMock
from django.test import override_settings
from django.core.cache import caches
from rest_framework.test import APITestCase
from rest_framework import status
import redis.exceptions

from users.models import User
from client.models import Client, AICalorieLog
from admin_panel.models import Country, Goal, Specialization
from client.apiNinja import get_nutrition_data


class Phase4HardeningTests(APITestCase):

    def setUp(self):
        # Clear rate limit cache between test runs
        try:
            caches['ratelimit'].clear()
        except Exception:
            pass

        self.country = Country.objects.create(name="Testland")
        self.goal = Goal.objects.create(name="Health")
        self.specialization = Specialization.objects.create(name="General")

        # Admin user
        self.admin_user = User.objects.create_user(
            username="admin_p4",
            email="admin_p4@test.com",
            password="AdminPassword123!",
            role="high_admin",
            is_staff=True,
        )

        # Client user
        self.client_user = User.objects.create_user(
            username="client_p4",
            email="client_p4@test.com",
            password="ClientPassword123!",
            role="client",
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            country=self.country,
            goal=self.goal,
            age=30,
            weight=70.0,
            height=175.0,
            gender="female",
            is_banned=False,
            is_premium=True,
        )

        from client.models import PremiumSubscription
        from django.utils import timezone
        from datetime import timedelta

        self.subscription = PremiumSubscription.objects.create(
            client=self.client_profile,
            status='active',
            end_date=timezone.now() + timedelta(days=30),
        )

    def tearDown(self):
        self.client.logout()
        try:
            caches['ratelimit'].clear()
        except Exception:
            pass

    # ── 1. BE-018: Redis Rate Limiting & Health Probe ─────────────────────────

    def test_redis_health_probe(self):
        """GET /api/v1/health/redis/ should confirm Redis connection and ratelimit db."""
        resp = self.client.get("/api/v1/health/redis/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "healthy")
        self.assertEqual(resp.data["redis"], "connected")
        self.assertEqual(resp.data["ratelimit_db"], "active")

    @override_settings(RATELIMIT_ENABLE=True)
    def test_rate_limiting_triggered_after_5_attempts(self):
        """After 5 POST attempts from the same IP, the 6th must receive HTTP 429."""
        from rest_framework.test import APIClient
        caches['ratelimit'].clear()
        client = APIClient()
        login_url = "/api/v1/auth/login/"
        payload = {"email": "invalid@test.com", "password": "WrongPassword!"}

        with patch("time.time", return_value=1700000010.0):
            # First 5 attempts: rejected with 401 (invalid credentials), but NOT rate limited
            for i in range(5):
                resp = client.post(login_url, payload, format="json", REMOTE_ADDR="192.168.1.100")
                self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED, f"Attempt {i+1} failed unexpectedly")

            # 6th attempt: must trigger HTTP 429 RATE_LIMITED
            resp = client.post(login_url, payload, format="json", REMOTE_ADDR="192.168.1.100")
            self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            self.assertEqual(resp.data.get("code"), "RATE_LIMITED")

    @override_settings(RATELIMIT_ENABLE=True)
    def test_multi_client_shared_redis_rate_limit_bucket(self):
        """Two separate client/worker contexts hitting the same IP share the Redis rate limit bucket."""
        from rest_framework.test import APIClient
        caches['ratelimit'].clear()

        worker_1 = APIClient()
        worker_2 = APIClient()
        login_url = "/api/v1/auth/login/"
        payload = {"email": "bad@test.com", "password": "Wrong!"}

        with patch("time.time", return_value=1700000020.0):
            # Worker 1 makes 3 failed attempts
            for _ in range(3):
                r = worker_1.post(login_url, payload, format="json", REMOTE_ADDR="10.0.0.99")
                self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

            # Worker 2 makes 2 failed attempts (total = 5 across workers)
            for _ in range(2):
                r = worker_2.post(login_url, payload, format="json", REMOTE_ADDR="10.0.0.99")
                self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

            # Worker 1 or 2 makes the 6th attempt -> must be 429 RATE_LIMITED across workers
            r6 = worker_1.post(login_url, payload, format="json", REMOTE_ADDR="10.0.0.99")
            self.assertEqual(r6.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            self.assertEqual(r6.data.get("code"), "RATE_LIMITED")

            r7 = worker_2.post(login_url, payload, format="json", REMOTE_ADDR="10.0.0.99")
            self.assertEqual(r7.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_ratelimit_cache_fail_closed_configuration(self):
        """Confirm ratelimit cache is configured with IGNORE_EXCEPTIONS: False (fail-closed)."""
        ratelimit_cache = caches['ratelimit']
        # Fail-closed is enforced by options in settings
        self.assertFalse(
            ratelimit_cache._ignore_exceptions,
            "Ratelimit cache must fail-closed (IGNORE_EXCEPTIONS=False) to prevent silent rate limit bypasses."
        )

    # ── 2. BE-015: Admin Soft-Delete Sets Client is_banned=True ───────────────

    def test_admin_user_deactivation_sets_client_banned(self):
        """Admin soft-deleting a client must set user.is_active=False and client.is_banned=True."""
        self.client.force_authenticate(user=self.admin_user)
        self.assertFalse(self.client_profile.is_banned)
        self.assertTrue(self.client_user.is_active)

        resp = self.client.delete(f"/api/v1/lookup/admin/users/{self.client_user.id}/delete/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        self.client_user.refresh_from_db()
        self.client_profile.refresh_from_db()

        self.assertFalse(self.client_user.is_active, "User should be deactivated (is_active=False)")
        self.assertTrue(self.client_profile.is_banned, "Client should be banned (is_banned=True)")

    # ── 3. BE-016: CalorieNinjas N+1 Request Consolidation ────────────────────

    @patch("requests.get")
    def test_calorieninjas_single_batch_http_request(self, mock_get):
        """Multiple ingredients should be batched into a single CalorieNinjas GET request."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {
                    "name": "apple",
                    "calories": 52.0,
                    "protein_g": 0.3,
                    "carbohydrates_total_g": 14.0,
                    "fat_total_g": 0.2,
                },
                {
                    "name": "banana",
                    "calories": 89.0,
                    "protein_g": 1.1,
                    "carbohydrates_total_g": 23.0,
                    "fat_total_g": 0.3,
                },
                {
                    "name": "chicken breast",
                    "calories": 165.0,
                    "protein_g": 31.0,
                    "carbohydrates_total_g": 0.0,
                    "fat_total_g": 3.6,
                },
            ]
        }
        mock_get.return_value = mock_response

        ingredients = [
            {"name": "apple", "mass_grams": 150.0},
            {"name": "banana", "mass_grams": 100.0},
            {"name": "chicken breast", "mass_grams": 200.0},
        ]

        data = get_nutrition_data(ingredients)

        # Assert only 1 HTTP request made for all 3 ingredients
        self.assertEqual(mock_get.call_count, 1)
        args, kwargs = mock_get.call_args
        self.assertIn("100g apple, 100g banana, 100g chicken breast", kwargs["params"]["query"])

        # Check calculated totals:
        # apple: 52 * 1.5 = 78 cal
        # banana: 89 * 1.0 = 89 cal
        # chicken: 165 * 2.0 = 330 cal
        # Total = 78 + 89 + 330 = 497.0
        self.assertEqual(data["total_calories"], 497.0)
        self.assertEqual(len(data["foods"]), 3)
        self.assertTrue(all(f["found"] for f in data["foods"]))

    # ── 4. BE-017: Non-Positive Food Mass Validation ─────────────────────────

    def test_api_ninja_rejects_negative_and_zero_mass(self):
        """get_nutrition_data should raise ValueError if mass_grams <= 0."""
        with self.assertRaises(ValueError) as ctx:
            get_nutrition_data([{"name": "rice", "mass_grams": -50.0}])
        self.assertIn("mass_grams must be strictly positive", str(ctx.exception))

        with self.assertRaises(ValueError) as ctx:
            get_nutrition_data([{"name": "rice", "mass_grams": 0.0}])
        self.assertIn("mass_grams must be strictly positive", str(ctx.exception))

    def test_ai_calorie_confirm_view_rejects_negative_mass(self):
        """AICalorieConfirmView should return HTTP 400 when mass_grams is <= 0."""
        self.client.force_authenticate(user=self.client_user)

        ai_log = AICalorieLog.objects.create(
            client=self.client_profile,
            meal_type="lunch",
            image_url="http://example.com/food.jpg",
            ai_raw_prediction=[{"label": "apple", "confidence": 0.95}],
            status="pending_user_review",
        )

        resp = self.client.patch(
            f"/api/v1/client/calorie-tracker/ai/{ai_log.id}/confirm/",
            {
                "meal_type": "lunch",
                "user_final_log": [
                    {"label": "apple", "mass_grams": -100.0}
                ]
            },
            format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["status"], "error")
        self.assertIn("user_final_log", resp.data["errors"])

    # ── 5. BE-019: Admin User List Explicit Pagination ────────────────────────

    def test_admin_user_list_returns_20_per_page_with_pagination_metadata(self):
        """GET /api/v1/lookup/admin/users/ must return exactly 20 users on page 1 with count/next/previous."""
        self.client.force_authenticate(user=self.admin_user)

        # Create 25 additional users (plus the 2 already in setUp = 27 total)
        for i in range(25):
            User.objects.create_user(
                username=f"page_user_{i}",
                email=f"page_user_{i}@test.com",
                password="UserPassword123!",
                role="client",
            )

        resp = self.client.get("/api/v1/lookup/admin/users/?page=1")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Pagination metadata checks
        self.assertIn("count", resp.data)
        self.assertIn("next", resp.data)
        self.assertIn("previous", resp.data)
        self.assertIn("results", resp.data)

        self.assertGreaterEqual(resp.data["count"], 27)
        self.assertEqual(len(resp.data["results"]), 20)
        self.assertIsNotNone(resp.data["next"])
        self.assertIsNone(resp.data["previous"])

        # Check page 2
        resp_page2 = self.client.get("/api/v1/lookup/admin/users/?page=2")
        self.assertEqual(resp_page2.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp_page2.data["results"]), 7)
        self.assertIsNotNone(resp_page2.data["previous"])
