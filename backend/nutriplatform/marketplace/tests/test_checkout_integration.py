from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
import datetime
import uuid

from users.models import User
from client.models import Client
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization
from marketplace.models import Plan, UserPlan, Invoice, CheckoutSession, Consultation


class CheckoutIntegrationTests(APITestCase):

    def setUp(self):
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Weight Loss")
        self.specialization = Specialization.objects.create(name="Sports Nutrition")

        # Client User
        self.client_user = User.objects.create_user(
            username="clientuser",
            email="client@test.com",
            password="TestPassword123!",
            role="client",
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            country=self.country,
            goal=self.goal,
            age=28,
            weight=70.0,
            height=175.0,
            gender="female",
        )

        # Nutritionist User
        self.nutritionist_user = User.objects.create_user(
            username="nutriuser",
            email="nutritionist@test.com",
            password="TestPassword123!",
            role="nutritionist",
        )
        self.nutritionist_profile = Nutritionist.objects.create(
            user=self.nutritionist_user,
            country=self.country,
            specialization=self.specialization,
            consultation_price=50.0,
            is_approved=True,
            approval_status="approved",
        )

        # Approved Meal Plan
        self.plan = Plan.objects.create(
            creator=self.nutritionist_profile,
            title="7-Day Healthy Reset",
            description="A balanced nutritional plan.",
            plan_type="public-predefined",
            price=29.99,
            duration_days=7,
            status="approved",
            content_json=[{"day": 1, "meals": []}],
        )

    def authenticate_client(self):
        login_resp = self.client.post("/api/v1/auth/login/", {
            "email": "client@test.com",
            "password": "TestPassword123!",
        }, format="json")
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        token = login_resp.data["data"]["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return token

    def test_plan_checkout_session_creation(self):
        self.authenticate_client()

        response = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("checkout_id", response.data["data"])
        checkout_id = response.data["data"]["checkout_id"]

        session = CheckoutSession.objects.get(checkout_id=checkout_id)
        self.assertEqual(session.user, self.client_user)
        self.assertEqual(session.item_type, "MEAL_PLAN")
        self.assertEqual(session.resolved_price, 29.99)
        self.assertEqual(session.status, "pending")

    def test_plan_checkout_confirmation_success(self):
        self.authenticate_client()

        # Create session
        create_resp = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        checkout_id = create_resp.data["data"]["checkout_id"]

        # Confirm session
        confirm_resp = self.client.post(f"/api/v1/checkout/{checkout_id}/confirm/", {
            "transaction_number": f"TXN-TEST-{uuid.uuid4().hex[:8]}",
        }, format="json")

        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserPlan.objects.filter(client=self.client_profile, plan=self.plan, status="active").exists())
        self.assertTrue(Invoice.objects.filter(client=self.client_profile, total_paid=29.99).exists())

        session = CheckoutSession.objects.get(checkout_id=checkout_id)
        self.assertEqual(session.status, "confirmed")

    def test_consultation_checkout_session_creation(self):
        self.authenticate_client()

        response = self.client.post("/api/v1/checkout/create/", {
            "item_type": "CONSULTATION",
            "item_id": self.nutritionist_profile.nutritionist_id,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("checkout_id", response.data["data"])
        checkout_id = response.data["data"]["checkout_id"]

        session = CheckoutSession.objects.get(checkout_id=checkout_id)
        self.assertEqual(session.resolved_price, 50.0)
        self.assertEqual(session.item_type, "CONSULTATION")

    def test_legacy_plan_purchase_baseline(self):
        self.authenticate_client()

        # Attempt price tampering on legacy endpoint: plan is 29.99, client tries to pay 0.01
        tampered_resp = self.client.post(f"/api/v1/marketplace/plans/{self.plan.id}/purchase/", {
            "amount_paid": 0.01,
            "transaction_number": "TXN-TAMPER-001",
        }, format="json")
        self.assertEqual(tampered_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(tampered_resp.data.get("code"), "PRICE_TAMPERING_DETECTED")

        # Legitimate purchase matching exact plan price succeeds
        valid_resp = self.client.post(f"/api/v1/marketplace/plans/{self.plan.id}/purchase/", {
            "amount_paid": 29.99,
            "transaction_number": "TXN-VALID-001",
        }, format="json")
        self.assertEqual(valid_resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserPlan.objects.filter(client=self.client_profile, plan=self.plan).exists())

    def test_stripe_payment_intent_creation(self):
        self.authenticate_client()

        create_resp = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        checkout_id = create_resp.data["data"]["checkout_id"]

        # Client submits Stripe token / payment method ID
        confirm_resp = self.client.post(f"/api/v1/checkout/{checkout_id}/confirm/", {
            "payment_method_id": "pm_card_visa_test_token",
        }, format="json")

        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        session = CheckoutSession.objects.get(checkout_id=checkout_id)
        self.assertEqual(session.status, "confirmed")

    def test_direct_consultation_booking_deprecated(self):
        self.authenticate_client()

        resp = self.client.post("/api/v1/client/consultations/book/", {
            "nutritionist_id": self.nutritionist_profile.nutritionist_id,
            "appointment_date": "2026-10-10",
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "consultation_type": "advice_only",
        }, format="json")

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data.get("code"), "CHECKOUT_REQUIRED")
        self.assertFalse(Consultation.objects.filter(client=self.client_profile).exists())

