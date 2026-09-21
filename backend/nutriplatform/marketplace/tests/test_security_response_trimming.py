from rest_framework.test import APITestCase
from rest_framework import status

from users.models import User
from client.models import Client
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization
from marketplace.models import Plan, UserPlan


class SecurityResponseTrimmingTests(APITestCase):

    def setUp(self):
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Fitness")
        self.specialization = Specialization.objects.create(name="Sports")

        # Buyer Client
        self.client_user = User.objects.create_user(
            username="buyer_trim",
            email="buyer_trim@test.com",
            password="TestPassword123!",
            role="client"
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            country=self.country,
            goal=self.goal,
            is_premium=False
        )

        # Other Client (Non-buyer)
        self.other_user = User.objects.create_user(
            username="other_trim",
            email="other_trim@test.com",
            password="TestPassword123!",
            role="client"
        )
        self.other_profile = Client.objects.create(
            user=self.other_user,
            country=self.country,
            goal=self.goal,
            is_premium=False
        )

        # Nutritionist
        self.nutritionist_user = User.objects.create_user(
            username="nutri_trim",
            email="nutri_trim@test.com",
            password="TestPassword123!",
            role="nutritionist"
        )
        self.nutritionist_profile = Nutritionist.objects.create(
            user=self.nutritionist_user,
            country=self.country,
            specialization=self.specialization,
            is_approved=True,
            approval_status="approved"
        )

        # Multi-day Plan (3 Days of proprietary content)
        self.plan = Plan.objects.create(
            creator=self.nutritionist_profile,
            title="3-Day Pro Metabolism Reset",
            description="Proprietary chef-crafted recipes",
            plan_type="public-predefined",
            price=49.99,
            duration_days=3,
            status="approved",
            content_json=[
                {"day_index": 0, "day": 1, "breakfast": {"name": "Oatmeal"}},
                {"day_index": 1, "day": 2, "lunch": {"name": "Salmon Salad"}},
                {"day_index": 2, "day": 3, "dinner": {"name": "Steak & Veggies"}},
            ]
        )

    def test_public_marketplace_plan_detail_returns_day_1_only(self):
        """Unauthenticated visitor requesting plan detail only receives Day 1 preview."""
        resp = self.client.get(f"/api/v1/marketplace/plans/{self.plan.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data["data"]
        self.assertTrue(data.get("is_preview"))
        content = data.get("content_json")
        self.assertIsInstance(content, list)
        self.assertEqual(len(content), 1, "Public preview must contain exactly 1 day.")
        self.assertEqual(content[0]["day"], 1)

    def test_verified_buyer_fetches_full_plan_content_via_user_plans(self):
        """Verified buyer can access all days (e.g. Day 2) via the authorized client endpoint."""
        user_plan = UserPlan.objects.create(
            client=self.client_profile,
            plan=self.plan,
            current_day_index=1,
            status="active"
        )
        self.client.force_authenticate(user=self.client_user)

        # Request day index 1 (Day 2)
        resp = self.client.get(f"/api/v1/client/user-plans/{user_plan.id}/content/?day=1")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["data"]["day_index"], 1)
        lunch = resp.data["data"]["lunch"]
        self.assertEqual(lunch["name"], "Salmon Salad")

    def test_unauthenticated_client_cannot_fetch_user_plan_content(self):
        """Unauthenticated request to user plan content returns 401 Unauthorized."""
        user_plan = UserPlan.objects.create(
            client=self.client_profile,
            plan=self.plan,
            current_day_index=0,
            status="active"
        )
        resp = self.client.get(f"/api/v1/client/user-plans/{user_plan.id}/content/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
