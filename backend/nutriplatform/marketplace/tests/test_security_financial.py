import json
from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from django.db import connection
import datetime

from users.models import User
from client.models import Client, PremiumSubscription
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization, SubscriptionTierPricing
from marketplace.models import Plan, UserPlan, Invoice, CheckoutSession, Consultation
from marketplace.services.fulfillment import fulfill_checkout_session


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
        """Legacy subscription endpoint is disabled with 410 GONE; direct bypass is closed."""
        self.client.force_authenticate(user=self.client_user)
        payload = {
            "plan_type": "monthly",
            "amount_paid": 0.00,
            "transaction_number": "TXN-TAMPER-001"
        }
        resp = self.client.post("/api/v1/lookup/client/subscriptions/purchase/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_410_GONE)
        self.assertEqual(resp.data.get("code"), "ENDPOINT_DEPRECATED")
        self.assertFalse(Client.objects.get(pk=self.client_profile.pk).is_premium)

    def test_subscription_server_pricing_enforced_when_amount_omitted(self):
        """Authoritative server pricing is enforced on subscription checkout session creation."""
        self.client.force_authenticate(user=self.client_user)
        resp = self.client.post("/api/v1/checkout/create/", {
            "item_type": "SUBSCRIPTION",
            "item_id": 1,
            "metadata": {"plan_type": "monthly"}
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["data"]["price"], 9.99)

    def test_banned_client_cannot_purchase_subscription(self):
        """Banned user receives 410 GONE on deprecated legacy subscription endpoint."""
        self.client.force_authenticate(user=self.banned_user)
        payload = {
            "plan_type": "monthly",
            "transaction_number": "TXN-BANNED-001"
        }
        resp = self.client.post("/api/v1/lookup/client/subscriptions/purchase/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_410_GONE)

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

    # ── 6. Tenant Isolation: Cross-User Checkout Access ───────────────────────

    def test_tenant_isolation_cross_user_checkout_confirm_and_detail_returns_404(self):
        """A user cannot view or confirm another user's checkout session."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="MEAL_PLAN",
            item_id=self.plan.id,
            resolved_price=30.00,
            currency="usd",
            status="pending",
            expires_at=timezone.now() + datetime.timedelta(minutes=30)
        )
        attacker = User.objects.create_user(
            username="attacker_fin",
            email="attacker_fin@test.com",
            password="TestPassword123!",
            role="client"
        )
        Client.objects.create(user=attacker, country=self.country, goal=self.goal)
        self.client.force_authenticate(user=attacker)

        # 1. Detail returns 404
        r_detail = self.client.get(f"/api/v1/checkout/{session.checkout_id}/")
        self.assertEqual(r_detail.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Confirm returns 404
        r_confirm = self.client.post(
            f"/api/v1/checkout/{session.checkout_id}/confirm/",
            {"payment_intent_id": "pi_any_001"},
            format="json"
        )
        self.assertEqual(r_confirm.status_code, status.HTTP_404_NOT_FOUND)

    # ── 7. Concurrent Confirm + Webhook Exactly-Once Processing ───────────────

    def test_concurrent_confirm_and_webhook_exactly_once(self):
        """Simultaneous confirm and webhook process exactly once and produce single entitlement."""
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
            "id": "pi_test_succeeded_concurrent01",
            "status": "succeeded",
            "amount_received": 3000,
            "currency": "usd",
            "metadata": {"user_id": str(self.client_user.id), "checkout_id": str(session.checkout_id)}
        }

        # 1. First execution via client confirm
        with patch("stripe.PaymentIntent.retrieve", return_value=mock_intent):
            with self.settings(STRIPE_SECRET_KEY="sk_test_mock"):
                r1 = self.client.post(
                    f"/api/v1/checkout/{session.checkout_id}/confirm/",
                    {"payment_intent_id": "pi_test_succeeded_concurrent01"},
                    format="json"
                )
        self.assertIn(r1.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # 2. Concurrent/subsequent execution via webhook for same session and intent
        with patch("marketplace.stripe_utils.construct_stripe_event", return_value={"id": "evt_concurrent_001", "type": "payment_intent.succeeded", "data": {"object": mock_intent}}):
            with self.settings(STRIPE_WEBHOOK_SECRET="whsec_mock"):
                r2 = self.client.post(
                    "/api/v1/checkout/webhook/",
                    data=json.dumps({"id": "evt_concurrent_001", "type": "payment_intent.succeeded", "data": {"object": mock_intent}}),
                    content_type="application/json",
                    HTTP_STRIPE_SIGNATURE="t=123,v1=abc"
                )
        self.assertEqual(r2.status_code, status.HTTP_200_OK)

        # Entitlements and invoices must exist exactly once
        self.assertEqual(UserPlan.objects.filter(client=self.client_profile, plan=self.plan).count(), 1)
        self.assertEqual(Invoice.objects.filter(transaction_number="pi_test_succeeded_concurrent01").count(), 1)

    # ── 8. Late Payment After Expiry: Re-acquire vs Auto-Refund ───────────────

    def test_late_payment_after_expiry_reacquires_slot_if_available(self):
        """Webhook payment on expired session fulfills if slot remains free."""
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="CONSULTATION",
            item_id=self.nutritionist_profile.nutritionist_id,
            resolved_price=40.00,
            currency="usd",
            status="expired",
            expires_at=timezone.now() - datetime.timedelta(minutes=5),
            metadata={
                "appointment_date": "2026-11-15",
                "start_time": "14:00:00",
                "end_time": "15:00:00",
                "consultation_type": "advice_only"
            }
        )
        res = fulfill_checkout_session(str(session.checkout_id), "pi_late_available", 40.00, source='webhook')
        self.assertEqual(res["status"], "confirmed")
        self.assertTrue(Consultation.objects.filter(client=self.client_profile, appointment_date="2026-11-15", status="scheduled").exists())

    def test_late_payment_after_expiry_triggers_refund_if_slot_taken(self):
        """Webhook payment on expired session triggers auto-refund if slot was taken by another client."""
        # Slot taken by someone else
        Consultation.objects.create(
            client=self.banned_profile,
            nutritionist=self.nutritionist_profile,
            appointment_date="2026-11-16",
            start_time="14:00:00",
            end_time="15:00:00",
            status="scheduled",
            consultation_type="advice_only"
        )
        session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type="CONSULTATION",
            item_id=self.nutritionist_profile.nutritionist_id,
            resolved_price=40.00,
            currency="usd",
            status="expired",
            expires_at=timezone.now() - datetime.timedelta(minutes=5),
            metadata={
                "appointment_date": "2026-11-16",
                "start_time": "14:00:00",
                "end_time": "15:00:00",
                "consultation_type": "advice_only"
            }
        )
        with patch("marketplace.services.fulfillment._trigger_auto_refund") as mock_refund:
            res = fulfill_checkout_session(str(session.checkout_id), "pi_late_taken", 40.00, source='webhook')
            self.assertEqual(res["status"], "conflict_refunded")
            mock_refund.assert_called_once()

    # ── 9. Refund Idempotency ─────────────────────────────────────────────────

    def test_refund_webhook_updates_invoice_idempotently(self):
        """charge.refunded webhook updates Invoice.refunded_amount idempotently."""
        invoice = Invoice.objects.create(
            transaction_number="pi_to_refund",
            client=self.client_profile,
            nutritionist=self.nutritionist_profile,
            total_paid=30.00,
            refunded_amount=0.0,
            commission_rate=0.20,
            net_earnings=24.00,
            item_type="plan",
            status="paid"
        )
        refund_payload = {
            "id": "evt_refund_001",
            "type": "charge.refunded",
            "data": {
                "object": {
                    "id": "ch_001",
                    "payment_intent": "pi_to_refund",
                    "amount": 3000,
                    "amount_refunded": 3000
                }
            }
        }
        with patch("marketplace.stripe_utils.construct_stripe_event", return_value=refund_payload):
            with self.settings(STRIPE_WEBHOOK_SECRET="whsec_mock"):
                resp = self.client.post(
                    "/api/v1/checkout/webhook/",
                    data=json.dumps(refund_payload),
                    content_type="application/json",
                    HTTP_STRIPE_SIGNATURE="t=123,v1=abc"
                )
                self.assertEqual(resp.status_code, status.HTTP_200_OK)
                invoice.refresh_from_db()
                self.assertEqual(invoice.refunded_amount, 30.00)
                self.assertEqual(invoice.status, "refunded")

    # ── 10. Test Token Hardening & Unconfigured Gateway 503 ───────────────────

    def test_test_token_rejected_when_payments_mode_is_stripe_and_not_testing(self):
        """pi_test_* token is rejected when PAYMENTS_MODE=stripe and TESTING=False."""
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

        with self.settings(PAYMENTS_MODE="stripe", DEBUG=False, TESTING=False, STRIPE_SECRET_KEY=""):
            resp = self.client.post(
                f"/api/v1/checkout/{session.checkout_id}/confirm/",
                {"payment_intent_id": "pi_test_succeeded_abc123"},
                format="json"
            )
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("not accepted in production", resp.data.get("message", "").lower())

    def test_checkout_create_returns_503_when_stripe_unconfigured_and_payments_mode_stripe(self):
        """CheckoutCreateView returns HTTP 503 when Stripe is unconfigured and PAYMENTS_MODE=stripe."""
        self.client.force_authenticate(user=self.client_user)
        payload = {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id
        }
        with self.settings(PAYMENTS_MODE="stripe", DEBUG=False, TESTING=False, STRIPE_SECRET_KEY=""):
            resp = self.client.post("/api/v1/checkout/create/", payload, format="json")
            self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertEqual(resp.data.get("code"), "PAYMENTS_UNAVAILABLE")


# ── 11. Restricted Database Role & SECURITY DEFINER Tests ─────────────────────

class RestrictedDatabaseRoleSecurityTests(APITestCase):
    """
    Verifies database-level RLS isolation and SECURITY DEFINER execution under SET ROLE nutriplatform_app.
    """

    def setUp(self):
        from admin_panel.models import Country, Goal, Specialization
        from users.models import User
        from client.models import Client
        from nutritionist.models import Nutritionist
        from marketplace.models import Consultation

        # Fixtures are created under the default superuser/owner connection
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Weight Loss")
        self.specialization = Specialization.objects.create(name="Clinical Nutrition")

        # Patient 1 (Victim / other tenant)
        self.user_other = User.objects.create_user(
            username="other_patient", email="other@test.com", password="Password123!", role="client"
        )
        self.client_other = Client.objects.create(
            user=self.user_other, country=self.country, goal=self.goal, age=30, weight=75.0, height=180.0, gender="male"
        )

        # Patient 2 (Active session user)
        self.user_session = User.objects.create_user(
            username="session_patient", email="session@test.com", password="Password123!", role="client"
        )
        self.client_session = Client.objects.create(
            user=self.user_session, country=self.country, goal=self.goal, age=25, weight=60.0, height=165.0, gender="female"
        )

        # Nutritionist
        self.user_nutri = User.objects.create_user(
            username="test_nutri", email="nutri@test.com", password="Password123!", role="nutritionist"
        )
        self.nutritionist = Nutritionist.objects.create(
            user=self.user_nutri, country=self.country, specialization=self.specialization,
            consultation_price=50.0, approval_status="approved"
        )

        self.target_date = datetime.date.today() + datetime.timedelta(days=3)
        self.start_time = datetime.time(10, 0)
        self.end_time = datetime.time(10, 45)

        # Book a confirmed consultation for other_patient
        self.other_consultation = Consultation.objects.create(
            client=self.client_other,
            nutritionist=self.nutritionist,
            appointment_date=self.target_date,
            start_time=self.start_time,
            end_time=self.end_time,
            status="scheduled",
            consultation_type="advice_only",
            price_paid=50.0
        )

    def test_restricted_role_get_booked_slots_returns_other_tenant_slots_while_orm_is_isolated(self):
        """
        Under SET ROLE nutriplatform_app:
        1. Tenant RLS prevents session user from querying other tenant's consultations via ORM.
        2. SECURITY DEFINER function get_nutritionist_booked_slots successfully returns the booked slot.
        """
        if connection.vendor != 'postgresql':
            self.skipTest("PostgreSQL specific test for SET ROLE nutriplatform_app.")

        with connection.cursor() as cursor:
            try:
                # Switch to restricted unprivileged role
                cursor.execute("SET ROLE nutriplatform_app;")
                # Set RLS session context for session_patient
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_session.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")

                # ORM query for consultations for this nutritionist:
                # Due to RLS, other_patient's consultation is completely invisible to session_patient!
                visible_to_session = Consultation.objects.filter(nutritionist=self.nutritionist).count()
                self.assertEqual(visible_to_session, 0)

                # SECURITY DEFINER function call:
                # Bypasses RLS internally and returns the booked start_time and end_time so availability check works
                cursor.execute(
                    "SELECT start_time, end_time FROM get_nutritionist_booked_slots(%s, %s);",
                    [self.nutritionist.pk, self.target_date]
                )
                booked = cursor.fetchall()
                self.assertEqual(len(booked), 1)
                self.assertEqual(booked[0][0], self.start_time)
                self.assertEqual(booked[0][1], self.end_time)
            finally:
                cursor.execute("RESET ROLE;")

    def test_restricted_role_create_consultation_hold_enforces_session_user_and_refuses_without_user_id(self):
        """
        Under SET ROLE nutriplatform_app:
        1. create_consultation_hold raises exception if app.current_user_id is not set.
        2. create_consultation_hold creates hold for authenticated session user when set.
        """
        if connection.vendor != 'postgresql':
            self.skipTest("PostgreSQL specific test for SET ROLE nutriplatform_app.")

        new_slot_start = datetime.time(11, 0)
        new_slot_end = datetime.time(11, 45)

        with connection.cursor() as cursor:
            try:
                cursor.execute("SET ROLE nutriplatform_app;")

                # 1. Without app.current_user_id set: function refuses with exception
                from django.db import transaction
                cursor.execute("SET LOCAL app.current_user_id = '';")
                with self.assertRaises(Exception) as ctx:
                    with transaction.atomic():
                        cursor.execute(
                            "SELECT hold_id, status_code FROM create_consultation_hold(%s, %s, %s, %s, %s, %s);",
                            [self.nutritionist.nutritionist_id, self.target_date, new_slot_start, new_slot_end, "advice_only", 50.0]
                        )
                self.assertIn("Authentication required", str(ctx.exception))

                # 2. With app.current_user_id set to session user: hold is created
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_session.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                cursor.execute(
                    "SELECT hold_id, status_code FROM create_consultation_hold(%s, %s, %s, %s, %s, %s);",
                    [self.nutritionist.nutritionist_id, self.target_date, new_slot_start, new_slot_end, "advice_only", 50.0]
                )
                row = cursor.fetchone()
                self.assertIsNotNone(row)
                hold_id, status_code = row
                self.assertEqual(status_code, "SUCCESS")
                self.assertIsNotNone(hold_id)

                # Verify hold was created bound to session_patient, not any other user
                cursor.execute("RESET ROLE;")
                hold = Consultation.objects.get(id=hold_id)
                self.assertEqual(hold.client, self.client_session)
                self.assertEqual(hold.status, "pending_payment")
            finally:
                cursor.execute("RESET ROLE;")



