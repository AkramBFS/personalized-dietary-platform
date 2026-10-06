"""
Permanent regression and repro test suite for payment integrity and vulnerability remediation.
Verifies that all previously discovered financial bypasses, unearned entitlement grants,
and unauthenticated legacy checkout paths are permanently closed.
"""
import datetime
import hashlib
import hmac
import json
import time
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from admin_panel.models import Country, Goal, Specialization, SubscriptionTierPricing
from client.models import Client, PremiumSubscription
from marketplace.models import (
    CheckoutSession,
    Invoice,
    Plan,
    UserPlan,
    Consultation,
    StripeEventLog,
)
from nutritionist.models import Nutritionist
from users.models import User


class PaymentVulnerabilitiesReproTests(APITestCase):

    def setUp(self):
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Weight Loss")
        self.specialization = Specialization.objects.create(name="Sports Nutrition")

        # Client user
        self.user = User.objects.create_user(
            username="victim",
            email="v@t.com",
            password="Passw0rd!x",
            role="client"
        )
        self.cl = Client.objects.create(user=self.user, country=self.country, goal=self.goal)

        # Nutritionist user
        nu = User.objects.create_user(
            username="nutri",
            email="n@t.com",
            password="Passw0rd!x",
            role="nutritionist"
        )
        self.nutri = Nutritionist.objects.create(
            user=nu,
            country=self.country,
            specialization=self.specialization,
            consultation_price=40.0,
            is_approved=True,
            approval_status="approved"
        )

        # Plan
        self.plan = Plan.objects.create(
            creator=self.nutri,
            title="Premium Diet Plan",
            description="Detailed meal plan",
            plan_type="public-predefined",
            price=30.0,
            duration_days=7,
            status="approved"
        )

        # Pricing tiers
        SubscriptionTierPricing.objects.create(tier_code="pro_monthly", billing_cycle="monthly", price=9.99)
        SubscriptionTierPricing.objects.create(tier_code="pro_yearly", billing_cycle="yearly", price=89.99)

        self.client.force_authenticate(user=self.user)

    def _session(self, item_type, item_id, price, meta=None):
        return CheckoutSession.objects.create(
            user=self.user,
            item_type=item_type,
            item_id=item_id,
            resolved_price=price,
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30),
            metadata=meta or {}
        )

    # ── 1. Bypass Remediation: Fake Payment Methods & Arbitrary Tokens ─────────

    def test_confirm_with_fake_payment_method_rejected(self):
        """Confirming with payment_method_id but no verified payment_intent_id is rejected."""
        s = self._session("MEAL_PLAN", self.plan.id, 30.0)
        r = self.client.post(
            f"/api/v1/checkout/{s.checkout_id}/confirm/",
            {"payment_method_id": "pm_anything"},
            format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(UserPlan.objects.filter(client=self.cl, plan=self.plan).exists())
        self.assertEqual(Invoice.objects.count(), 0)

    def test_confirm_with_arbitrary_transaction_number_rejected(self):
        """Confirming with arbitrary transaction_number without Stripe payment is rejected."""
        s = self._session("SUBSCRIPTION", "2", 89.99, {"plan_type": "yearly", "duration_days": 365})
        r = self.client.post(
            f"/api/v1/checkout/{s.checkout_id}/confirm/",
            {"transaction_number": "hello_attacker_token"},
            format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(PremiumSubscription.objects.filter(client=self.cl, status="active").exists())
        self.assertEqual(Invoice.objects.count(), 0)

    # ── 2. Legacy Endpoint Deprecations (HTTP 410 Gone) ────────────────────────

    def test_legacy_subscription_endpoint_returns_410_gone(self):
        """Legacy direct subscription endpoint is disabled with HTTP 410 Gone."""
        r = self.client.post(
            "/api/v1/lookup/client/subscriptions/purchase/",
            {"plan_type": "yearly", "transaction_number": "FREE-FOR-ME-1"},
            format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_410_GONE)
        self.assertEqual(r.data.get("code"), "ENDPOINT_DEPRECATED")
        self.assertFalse(PremiumSubscription.objects.filter(client=self.cl).exists())

    def test_legacy_plan_purchase_returns_410_gone(self):
        """Legacy direct plan purchase endpoint is disabled with HTTP 410 Gone."""
        r = self.client.post(
            f"/api/v1/marketplace/plans/{self.plan.id}/purchase/",
            {},
            format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_410_GONE)
        self.assertEqual(r.data.get("code"), "ENDPOINT_DEPRECATED")
        self.assertFalse(UserPlan.objects.filter(client=self.cl).exists())

    def test_legacy_consultation_book_returns_410_gone(self):
        """Legacy direct consultation booking endpoint is disabled with HTTP 410 Gone."""
        r = self.client.post(
            "/api/v1/client/consultations/book/",
            {
                "nutritionist_id": self.nutri.nutritionist_id,
                "appointment_date": "2026-10-10",
                "start_time": "10:00:00",
                "end_time": "11:00:00",
            },
            format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_410_GONE)
        self.assertEqual(r.data.get("code"), "ENDPOINT_DEPRECATED")
        self.assertFalse(Consultation.objects.filter(client=self.cl).exists())

    # ── 3. Stripe Key Verification & Intent Binding ────────────────────────────

    @override_settings(STRIPE_SECRET_KEY="", PAYMENTS_MODE="stripe", TESTING=False)
    def test_mock_intent_prefix_rejected_when_payments_mode_is_stripe(self):
        """When in standard stripe mode without key, fake intent prefix is rejected."""
        s = self._session("MEAL_PLAN", self.plan.id, 30.0)
        r = self.client.post(
            f"/api/v1/checkout/{s.checkout_id}/confirm/",
            {"payment_intent_id": "pi_mock_succeeded_1"},
            format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(UserPlan.objects.filter(client=self.cl).exists())

    @override_settings(STRIPE_SECRET_KEY="sk_test_x")
    def test_intent_without_matching_metadata_rejected(self):
        """An intent without metadata matching client user_id and checkout_id is rejected."""
        s = self._session("MEAL_PLAN", self.plan.id, 30.0)
        pi = {
            "id": "pi_foreign",
            "status": "succeeded",
            "amount_received": 3000,
            "currency": "usd",
            "metadata": {}  # Missing user_id and checkout_id
        }
        with patch("stripe.PaymentIntent.retrieve", return_value=pi):
            r = self.client.post(
                f"/api/v1/checkout/{s.checkout_id}/confirm/",
                {"payment_intent_id": "pi_foreign"},
                format="json"
            )
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(UserPlan.objects.filter(client=self.cl).exists())

    # ── 4. Webhook Integrity & Price Verification ──────────────────────────────

    @override_settings(STRIPE_WEBHOOK_SECRET="whsec_test")
    def test_signed_webhook_rejects_underpaid_intent(self):
        """Webhook rejects payment_intent.succeeded if amount_received is below resolved price."""
        s = self._session("MEAL_PLAN", self.plan.id, 30.0)
        ev = {
            "id": "evt_cheap_1",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_cheap",
                    "amount_received": 50,  # $0.50 instead of $30.00
                    "currency": "usd",
                    "metadata": {
                        "checkout_id": str(s.checkout_id),
                        "user_id": str(self.user.id),
                    }
                }
            }
        }
        payload = json.dumps(ev)
        ts = str(int(time.time()))
        sig = hmac.new(b"whsec_test", f"{ts}.{payload}".encode(), hashlib.sha256).hexdigest()
        r = self.client.post(
            "/api/v1/checkout/webhook/",
            data=payload,
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE=f"t={ts},v1={sig}"
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data.get("status"), "ignored")
        self.assertFalse(UserPlan.objects.filter(client=self.cl, plan=self.plan).exists())

    @override_settings(STRIPE_WEBHOOK_SECRET="whsec_test")
    def test_webhook_authoritatively_fulfills_consultations(self):
        """Webhook properly fulfills consultations and creates scheduled booking."""
        s = self._session(
            "CONSULTATION",
            self.nutri.nutritionist_id,
            40.0,
            meta={
                "appointment_date": "2026-12-01",
                "start_time": "10:00:00",
                "end_time": "11:00:00",
                "consultation_type": "advice_only"
            }
        )
        ev = {
            "id": "evt_consult_1",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_consult_001",
                    "amount_received": 4000,
                    "currency": "usd",
                    "metadata": {
                        "checkout_id": str(s.checkout_id),
                        "user_id": str(self.user.id)
                    }
                }
            }
        }
        payload = json.dumps(ev)
        ts = str(int(time.time()))
        sig = hmac.new(b"whsec_test", f"{ts}.{payload}".encode(), hashlib.sha256).hexdigest()
        r = self.client.post(
            "/api/v1/checkout/webhook/",
            data=payload,
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE=f"t={ts},v1={sig}"
        )
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        s.refresh_from_db()
        self.assertEqual(s.status, "confirmed")
        self.assertTrue(Consultation.objects.filter(client=self.cl, nutritionist=self.nutri, status="scheduled").exists())
        self.assertTrue(Invoice.objects.filter(client=self.cl, total_paid=40.0).exists())

    # ── 5. Zero-Price Plans & Expired Session Guards ───────────────────────────

    def test_zero_price_plan_checkout_creates_and_fulfills_immediately(self):
        """Zero-price plans are fulfilled immediately without requiring Stripe PaymentIntent."""
        free_plan = Plan.objects.create(
            creator=self.nutri,
            title="Free Starter Plan",
            description="Free sample plan",
            plan_type="public-predefined",
            price=0.0,
            duration_days=3,
            status="approved"
        )
        r = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": free_plan.id,
        }, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["data"]["status"], "confirmed")
        self.assertTrue(r.data["data"]["is_free"])
        self.assertTrue(UserPlan.objects.filter(client=self.cl, plan=free_plan).exists())

    def test_expired_checkout_session_returns_410_gone(self):
        """Confirming an expired checkout session returns HTTP 410 Gone."""
        s = CheckoutSession.objects.create(
            user=self.user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.0,
            status="pending",
            expires_at=timezone.now() - datetime.timedelta(minutes=5)
        )
        r = self.client.post(
            f"/api/v1/checkout/{s.checkout_id}/confirm/",
            {"payment_intent_id": "pi_any_expired"},
            format="json"
        )
        self.assertEqual(r.status_code, status.HTTP_410_GONE)
        self.assertEqual(r.data.get("code"), "SESSION_EXPIRED")
