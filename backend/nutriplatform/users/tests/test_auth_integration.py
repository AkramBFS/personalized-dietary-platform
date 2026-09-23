from rest_framework.test import APITestCase
from rest_framework import status
from users.models import User
from client.models import Client
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization


class AuthIntegrationTests(APITestCase):

    def setUp(self):
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Weight Loss")
        self.specialization = Specialization.objects.create(name="Sports Nutrition")

        # Client User
        self.client_user = User.objects.create_user(
            username="client_auth",
            email="client_auth@test.com",
            password="TestPassword123!",
            role="client",
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            country=self.country,
            goal=self.goal,
            age=25,
            weight=75.0,
            height=175.0,
            gender="male",
        )

        # Approved Nutritionist User
        self.nutri_user = User.objects.create_user(
            username="nutri_auth",
            email="nutri_auth@test.com",
            password="TestPassword123!",
            role="nutritionist",
        )
        self.nutri_profile = Nutritionist.objects.create(
            user=self.nutri_user,
            country=self.country,
            specialization=self.specialization,
            is_approved=True,
            approval_status="approved",
        )

        # Admin User
        self.admin_user = User.objects.create_user(
            username="admin_auth",
            email="admin_auth@test.com",
            password="TestPassword123!",
            role="high_admin",
            is_staff=True,
        )

    def test_login_client(self):
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "client_auth@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", resp.data["data"])
        self.assertEqual(resp.data["data"]["user"]["role"], "client")

    def test_login_nutritionist(self):
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "nutri_auth@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", resp.data["data"])
        self.assertEqual(resp.data["data"]["user"]["role"], "nutritionist")

    def test_login_admin(self):
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "admin_auth@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", resp.data["data"])
        self.assertEqual(resp.data["data"]["user"]["role"], "high_admin")

    def test_token_refresh(self):
        login_resp = self.client.post("/api/v1/auth/login/", {
            "email": "client_auth@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        refresh = login_resp.data["data"]["tokens"]["refresh"]

        refresh_resp = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": refresh,
        }, format="json")
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.data)

    def test_logout_token_blacklisting(self):
        login_resp = self.client.post("/api/v1/auth/login/", {
            "email": "client_auth@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        access = login_resp.data["data"]["tokens"]["access"]
        refresh = login_resp.data["data"]["tokens"]["refresh"]

        # Logout with refresh token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        logout_resp = self.client.post("/api/v1/auth/logout/", {
            "refresh": refresh,
        }, format="json")
        self.assertEqual(logout_resp.status_code, status.HTTP_204_NO_CONTENT)

        # Refresh token is blacklisted; subsequent refresh must fail
        post_logout_refresh = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": refresh,
        }, format="json")
        self.assertEqual(post_logout_refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_pending_nutritionist_rejected(self):
        """BE-009: Pending nutritionists must be rejected at login with ACCOUNT_PENDING."""
        pending_user = User.objects.create_user(
            username="nutri_pending",
            email="nutri_pending@test.com",
            password="TestPassword123!",
            role="nutritionist",
        )
        from nutritionist.models import Nutritionist as NutriModel
        NutriModel.objects.create(
            user=pending_user,
            country=self.country,
            specialization=self.specialization,
            is_approved=False,
            approval_status="pending",
        )
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "nutri_pending@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data.get("code"), "ACCOUNT_PENDING")

    def test_login_rejected_nutritionist_rejected(self):
        """BE-009: Rejected nutritionists must be rejected at login with ACCOUNT_REJECTED."""
        rejected_user = User.objects.create_user(
            username="nutri_rejected",
            email="nutri_rejected@test.com",
            password="TestPassword123!",
            role="nutritionist",
        )
        from nutritionist.models import Nutritionist as NutriModel
        NutriModel.objects.create(
            user=rejected_user,
            country=self.country,
            specialization=self.specialization,
            is_approved=False,
            approval_status="rejected",
            rejection_reason="Invalid certification",
        )
        resp = self.client.post("/api/v1/auth/login/", {
            "email": "nutri_rejected@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data.get("code"), "ACCOUNT_REJECTED")

    def test_historical_committed_tokens_rejected_and_blacklisted(self):
        """Historical leaked tokens discovered in commit 813f054 are confirmed blacklisted and rejected."""
        historical_refresh_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODQyNjUyOCwiaWF0IjoxNzc3ODIxNzI4LCJqdGkiOiI2MGVkYzkxYjIzMmM0M2YyYTc4MTIyOWFhMWFhYjg2OCIsInVzZXJfaWQiOiIxNSJ9."
            "Eua4pAHyB5qjG5tbjZ8K2YITeM12F3HeYV0ZVKrkNfo"
        )
        historical_access_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc3ODI1MzI4LCJpYXQiOjE3Nzc4MjE3MzAsImp0aSI6ImU2ODI0MjMxZGNkZTRjZTg5MzI0ZmU2NmI2OTcyNzgwIiwidXNlcl9pZCI6IjE1In0."
            "ceG26Mt6ss--qpbbC5po9XlTCJmzCo7g2S7P1WBhZ1E"
        )

        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
        self.assertTrue(
            BlacklistedToken.objects.filter(token__jti="60edc91b232c43f2a781229aa1aab868").exists(),
            "Historical token JTI must be present in BlacklistedToken."
        )

        # Refreshing must fail
        refresh_resp = self.client.post("/api/v1/auth/token/refresh/", {
            "refresh": historical_refresh_token
        }, format="json")
        self.assertEqual(refresh_resp.status_code, status.HTTP_401_UNAUTHORIZED)

        # Access with leaked access token must fail
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {historical_access_token}")
        access_resp = self.client.get("/api/v1/client/profile/")
        self.assertEqual(access_resp.status_code, status.HTTP_401_UNAUTHORIZED)

