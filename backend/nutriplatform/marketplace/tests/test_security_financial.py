import json
from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
import datetime

from users.models import User
from client.models import Client, PremiumSubscription
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization, SubscriptionTierPricing
from marketplace.models import Plan, UserPlan, Invoice, CheckoutSession


class SecurityFinancialTests(APITestCase):

    def setUp(self):
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Fitness")
        self.specialization = Specialization.objects.create(name="Sports")

        # Client User
        self.client_user = User.objects.create_user(
            username="client_fin",
            email="client_fin@test.com",
            password="TestPassword123!",
            role="client"
        )
        self.client_profile = Client.objects.create(
            user=self.client_user,
            country=self.country,
            goal=self.goal,
            is_premium=False,
            is_banned=False
        )

        # Banned Client User
        self.banned_user = User.objects.create_user(
            username="banned_fin",
            email="banned_fin@test.com",
            password="TestPassword123!",
            role="client"
        )
        self.banned_profile = Client.objects.create(
            user=self.banned_user,
            country=self.country,
            goal=self.goal,
            is_premium=False,
            is_banned=True
        )

        # Nutritionist User
        self.nutritionist_user = User.objects.create_user(
            username="nutri_fin",
            email="nutri_fin@test.com",
            password="TestPassword123!",
            role="nutritionist"
        )
        self.nutritionist_profile = Nutritionist.objects.create(
            user=self.nutritionist_user,
            country=self.country,
            specialization=self.specialization,
            consultation_price=40.0,
            is_approved=True,
            approval_status="approved"
        )

        # Approved Plan
        self.plan = Plan.objects.create(
            creator=self.nutritionist_profile,
            title="Keto Power",
            description="Keto diet plan",
            plan_type="public-predefined",
            price=30.00,
            duration_days=7,
            status="approved"
        )

        # Subscription Tier Pricing
        SubscriptionTierPricing.objects.create(
            tier_code="pro_monthly",
            billing_cycle="monthly",
            price=9.99
        )
        SubscriptionTierPricing.objects.create(
            tier_code="pro_yearly",
            billing_cycle="yearly",
            price=89.99
        )

    # ── 1. Subscription Price Tampering Tests ─────────────────────────────────

    def test_free_subscription_price_tampering_rejected(self):
        """Attacker sending amount_paid: 0.00 must be rejected with 400 PRICE_MISMATCH."""
        self.client.force_authenticate(user=self.client_user)
        payload = {
            "plan_type": "monthly",
            "amount_paid": 0.00,
            "transaction_number": "TXN-TAMPER-001"
        }
        resp = self.client.post("/api/v1/lookup/client/subscriptions/purchase/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data.get("code"), "PRICE_MISMATCH")
        self.assertFalse(Client.objects.get(pk=self.client_profile.pk).is_premium)

    def test_subscription_server_pricing_enforced_when_amount_omitted(self):
        """When client omits amount_paid or provides valid price, server tier price (9.99) is enforced."""
        self.client.force_authenticate(user=self.client_user)
        payload = {
            "plan_type": "monthly",
            "transaction_number": "TXN-VALID-MONTHLY-001"
        }
        resp = self.client.post("/api/v1/lookup/client/subscriptions/purchase/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Client.objects.get(pk=self.client_profile.pk).is_premium)
        sub = PremiumSubscription.objects.get(transaction_number="TXN-VALID-MONTHLY-001")
        self.assertEqual(sub.amount_paid, 9.99)

    def test_banned_client_cannot_purchase_subscription(self):
        """Banned user must receive 403 Forbidden when attempting to purchase subscription."""
        self.client.force_authenticate(user=self.banned_user)
        payload = {
            "plan_type": "monthly",
            "transaction_number": "TXN-BANNED-001"
        }
        resp = self.client.post("/api/v1/lookup/client/subscriptions/purchase/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    # ── 2. Checkout Ban Checks ────────────────────────────────────────────────

    def test_banned_client_cannot_create_checkout_session(self):
        """Banned client is blocked from creating a checkout session."""
        self.client.force_authenticate(user=self.banned_user)
        payload = {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id
        }
        resp = self.client.post("/api/v1/checkout/create/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data.get("code"), "ACCOUNT_BANNED")

    def test_banned_client_cannot_confirm_checkout_session(self):
        """If a client was banned after creating a session, confirmation must be blocked."""
        # Create session before ban
        session = CheckoutSession.objects.create(
            user=self.banned_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        self.client.force_authenticate(user=self.banned_user)
        payload = {"transaction_number": "TXN-BANNED-CONFIRM"}
        resp = self.client.post(f"/api/v1/checkout/{session.checkout_id}/confirm/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data.get("code"), "ACCOUNT_BANNED")

    # ── 3. Stripe PaymentIntent Multi-Attribute Verification ─────────────────

    def test_stripe_payment_intent_wrong_user_rejected(self):
        """PaymentIntent tagged with different user_id must be rejected."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        self.client.force_authenticate(user=self.client_user)

        # Mock Stripe retrieve with mismatched user
        mock_intent = {
            "id": "pi_attacker_intent_001",
            "status": "succeeded",
            "amount_received": 3000,
            "currency": "usd",
            "metadata": {"user_id": str(self.nutritionist_user.id), "checkout_id": str(session.checkout_id)}
        }
        with patch("stripe.PaymentIntent.retrieve", return_value=mock_intent):
            with self.settings(STRIPE_SECRET_KEY="sk_test_mock"):
                resp = self.client.post(
                    f"/api/v1/checkout/{session.checkout_id}/confirm/",
                    {"payment_intent_id": "pi_attacker_intent_001"},
                    format="json"
                )
                self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stripe_payment_intent_wrong_currency_rejected(self):
        """PaymentIntent charged in EUR instead of USD must be rejected."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            currency="usd",
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        self.client.force_authenticate(user=self.client_user)

        mock_intent = {
            "id": "pi_currency_mismatch_001",
            "status": "succeeded",
            "amount_received": 3000,
            "currency": "eur",
            "metadata": {"user_id": str(self.client_user.id), "checkout_id": str(session.checkout_id)}
        }
        with patch("stripe.PaymentIntent.retrieve", return_value=mock_intent):
            with self.settings(STRIPE_SECRET_KEY="sk_test_mock"):
                resp = self.client.post(
                    f"/api/v1/checkout/{session.checkout_id}/confirm/",
                    {"payment_intent_id": "pi_currency_mismatch_001"},
                    format="json"
                )
                self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_underpaid_stripe_payment_intent_rejected(self):
        """PaymentIntent where amount_received < expected amount must be rejected."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            currency="usd",
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        self.client.force_authenticate(user=self.client_user)

        mock_intent = {
            "id": "pi_underpaid_001",
            "status": "succeeded",
            "amount_received": 100,  # $1 instead of $30
            "currency": "usd",
            "metadata": {"user_id": str(self.client_user.id), "checkout_id": str(session.checkout_id)}
        }
        with patch("stripe.PaymentIntent.retrieve", return_value=mock_intent):
            with self.settings(STRIPE_SECRET_KEY="sk_test_mock"):
                resp = self.client.post(
                    f"/api/v1/checkout/{session.checkout_id}/confirm/",
                    {"payment_intent_id": "pi_underpaid_001"},
                    format="json"
                )
                self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unconfirmed_stripe_payment_intent_rejected(self):
        """PaymentIntent not in 'succeeded' state must be rejected."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            currency="usd",
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        self.client.force_authenticate(user=self.client_user)

        mock_intent = {
            "id": "pi_unconfirmed_001",
            "status": "requires_payment_method",
            "amount_received": 0,
            "currency": "usd"
        }
        with patch("stripe.PaymentIntent.retrieve", return_value=mock_intent):
            with self.settings(STRIPE_SECRET_KEY="sk_test_mock"):
                resp = self.client.post(
                    f"/api/v1/checkout/{session.checkout_id}/confirm/",
                    {"payment_intent_id": "pi_unconfirmed_001"},
                    format="json"
                )
                self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_replayed_payment_intent_id_fails_uniqueness(self):
        """Replaying an existing transaction_number must return 409 Conflict."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        Invoice.objects.create(
            client=self.client_profile,
            nutritionist=self.nutritionist_profile,
            transaction_number="TXN-USED-BEFORE-12345",
            total_paid=30.00,
            commission_rate=0.20,
            net_earnings=24.00,
            item_type="plan"
        )
        self.client.force_authenticate(user=self.client_user)
        payload = {"transaction_number": "TXN-USED-BEFORE-12345"}
        resp = self.client.post(f"/api/v1/checkout/{session.checkout_id}/confirm/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp.data.get("code"), "TRANSACTION_ALREADY_USED")

    # ── 4. Webhook Cryptographic Verification & Idempotence ───────────────────

    def test_stripe_webhook_invalid_signature_rejected(self):
        """Webhook with invalid or missing Stripe signature must be rejected with 400."""
        payload = {"type": "payment_intent.succeeded"}
        resp = self.client.post(
            "/api/v1/checkout/webhook/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stripe_webhook_idempotent_duplicate_event_processing(self):
        """Webhook fulfills pending session; subsequent duplicate webhook returns 200 without double-crediting."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            currency="usd",
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        mock_event = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_webhook_success_001",
                    "status": "succeeded",
                    "amount_received": 3000,
                    "currency": "usd",
                    "metadata": {
                        "checkout_id": str(session.checkout_id),
                        "user_id": str(self.client_user.id)
                    }
                }
            }
        }
        with patch("marketplace.stripe_utils.construct_stripe_event", return_value=mock_event):
            # First webhook dispatch
            resp1 = self.client.post(
                "/api/v1/checkout/webhook/",
                data=json.dumps({"dummy": "data"}),
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE="t=123,v1=valid_sig"
            )
            self.assertEqual(resp1.status_code, status.HTTP_200_OK)
            self.assertTrue(UserPlan.objects.filter(client=self.client_profile, plan=self.plan).exists())

            # Second duplicate webhook dispatch
            resp2 = self.client.post(
                "/api/v1/checkout/webhook/",
                data=json.dumps({"dummy": "data"}),
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE="t=123,v1=valid_sig"
            )
            self.assertEqual(resp2.status_code, status.HTTP_200_OK)
            # Assert only 1 UserPlan and 1 Invoice created (no double crediting)
            self.assertEqual(UserPlan.objects.filter(client=self.client_profile, plan=self.plan).count(), 1)
            self.assertEqual(Invoice.objects.filter(transaction_number="pi_webhook_success_001").count(), 1)

    def test_real_stripe_webhook_cryptographic_signature_verification(self):
        """
        Verify real HMAC-SHA256 signature calculation using Stripe's algorithm without mocking construct_stripe_event.
        """
        import time
        import hmac
        import hashlib

        webhook_secret = "whsec_test_secret_for_real_hmac_verification_12345"
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            currency="usd",
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )

        real_payload_dict = {
            "id": "evt_test_real_crypto_001",
            "object": "event",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_real_crypto_001",
                    "status": "succeeded",
                    "amount_received": 3000,
                    "currency": "usd",
                    "metadata": {
                        "checkout_id": str(session.checkout_id),
                        "user_id": str(self.client_user.id)
                    }
                }
            }
        }
        raw_payload = json.dumps(real_payload_dict)

        # 1. Compute authentic Stripe signature: t={timestamp},v1={hmac}
        timestamp = int(time.time())
        signed_payload = f"{timestamp}.{raw_payload}".encode("utf-8")
        computed_sig = hmac.new(
            webhook_secret.encode("utf-8"),
            signed_payload,
            hashlib.sha256
        ).hexdigest()
        valid_sig_header = f"t={timestamp},v1={computed_sig}"

        with self.settings(STRIPE_WEBHOOK_SECRET=webhook_secret):
            # Dispatch with valid cryptographic signature without any mocks
            resp = self.client.post(
                "/api/v1/checkout/webhook/",
                data=raw_payload,
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE=valid_sig_header
            )
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertTrue(UserPlan.objects.filter(client=self.client_profile, plan=self.plan).exists())

            # 2. Tampered payload with original signature must be rejected
            tampered_payload = json.dumps({"id": "evt_tampered"})
            resp_tampered = self.client.post(
                "/api/v1/checkout/webhook/",
                data=tampered_payload,
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE=valid_sig_header
            )
            self.assertEqual(resp_tampered.status_code, status.HTTP_400_BAD_REQUEST)

            # 3. Forged signature must be rejected
            forged_sig_header = f"t={timestamp},v1=deadbeefcafebabe1234567890abcdef"
            resp_forged = self.client.post(
                "/api/v1/checkout/webhook/",
                data=raw_payload,
                content_type="application/json",
                HTTP_STRIPE_SIGNATURE=forged_sig_header
            )
            self.assertEqual(resp_forged.status_code, status.HTTP_400_BAD_REQUEST)

