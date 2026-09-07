from rest_framework.test import APITestCase
from rest_framework import status
from users.models import User
from client.models import Client
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization
from marketplace.models import Plan, UserPlan


class PlanProgressionTests(APITestCase):

    def setUp(self):
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Weight Loss")
        self.specialization = Specialization.objects.create(name="General Diet")

        self.client_user = User.objects.create_user(
            username="clientuser_plan",
            email="client_plan@test.com",
            password="TestPassword123!",
            role="client",
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            country=self.country,
            goal=self.goal,
            age=25,
            weight=70.0,
            height=170.0,
            gender="male",
        )

        self.nutritionist_user = User.objects.create_user(
            username="nutriuser_plan",
            email="nutri_plan@test.com",
            password="TestPassword123!",
            role="nutritionist",
        )
        self.nutritionist_profile = Nutritionist.objects.create(
            user=self.nutritionist_user,
            country=self.country,
            specialization=self.specialization,
            is_approved=True,
            approval_status="approved",
        )

        self.plan = Plan.objects.create(
            creator=self.nutritionist_profile,
            title="7 Day Plan",
            duration_days=7,
            status="approved",
            price=20.0,
            plan_type="public-predefined",
            content_json=[{"day": i} for i in range(1, 8)],
        )

    def authenticate_client(self):
        login_resp = self.client.post("/api/v1/auth/login/", {
            "email": "client_plan@test.com",
            "password": "TestPassword123!",
        }, format="json")
        token = login_resp.data["data"]["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_day_7_advancement_baseline(self):
        """
        Captures the off-by-one behavior where advancing to day index 6 (Day 7)
        in a 7-day plan triggers premature completion (status='completed')
        because current_day_index >= duration - 1.
        This records the baseline before the Phase 2 fix.
        """
        self.authenticate_client()

        user_plan = UserPlan.objects.create(
            client=self.client_profile,
            plan=self.plan,
            current_day_index=5,  # Completed Day 6 (0-indexed 5)
            status="active",
        )

        # Advance to day index 6 via PATCH
        response = self.client.patch(f"/api/v1/client/user-plans/{user_plan.id}/advance/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user_plan.refresh_from_db()
        self.assertEqual(user_plan.current_day_index, 6)
        # Baseline behavior in current codebase: marks as 'completed' prematurely
        self.assertEqual(user_plan.status, "completed")
