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
