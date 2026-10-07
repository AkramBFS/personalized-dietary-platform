from rest_framework.test import APITestCase
from rest_framework import status
from django.test import override_settings
from django.utils import timezone
import datetime
import uuid
from unittest.mock import patch, MagicMock

from users.models import User
from client.models import Client
from nutritionist.models import Nutritionist
from admin_panel.models import Country, Goal, Specialization
from marketplace.models import Plan, UserPlan, Invoice, CheckoutSession, Consultation


@override_settings(STRIPE_SECRET_KEY="sk_test_mock_secret")
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

        self.stripe_create_patcher = patch("stripe.PaymentIntent.create")
        self.mock_stripe_create = self.stripe_create_patcher.start()
        self.mock_stripe_create.return_value = type("MockIntent", (), {
            "id": "pi_mock_created_123",
            "client_secret": "pi_mock_created_123_secret"
        })()
        self.addCleanup(self.stripe_create_patcher.stop)

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

    @patch("stripe.PaymentIntent.retrieve")
    def test_plan_checkout_confirmation_success(self, mock_retrieve):
        self.authenticate_client()

        # Create session
        create_resp = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        checkout_id = create_resp.data["data"]["checkout_id"]

        mock_retrieve.return_value = {
            "id": "pi_plan_success_001",
            "status": "succeeded",
            "amount_received": 2999,
            "currency": "usd",
            "metadata": {
                "user_id": str(self.client_user.id),
                "checkout_id": checkout_id
            }
        }

        # Confirm session
        confirm_resp = self.client.post(f"/api/v1/checkout/{checkout_id}/confirm/", {
            "payment_intent_id": "pi_plan_success_001",
        }, format="json")

        self.assertEqual(confirm_resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserPlan.objects.filter(client=self.client_profile, plan=self.plan, status="active").exists())
        self.assertTrue(Invoice.objects.filter(client=self.client_profile, total_paid=29.99).exists())

        session = CheckoutSession.objects.get(checkout_id=checkout_id)
        self.assertEqual(session.status, "confirmed")

    def test_consultation_checkout_session_creation(self):
        self.authenticate_client()

        slot_data = {
            "appointment_date": "2026-10-15",
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "consultation_type": "advice_only",
        }
        response = self.client.post("/api/v1/checkout/create/", {
            "item_type": "CONSULTATION",
            "item_id": self.nutritionist_profile.nutritionist_id,
            "metadata": slot_data,
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("checkout_id", response.data["data"])
        checkout_id = response.data["data"]["checkout_id"]

        session = CheckoutSession.objects.get(checkout_id=checkout_id)
        self.assertEqual(session.resolved_price, 50.0)
        self.assertEqual(session.item_type, "CONSULTATION")

    def test_legacy_plan_purchase_baseline(self):
        self.authenticate_client()

        # Legacy purchase endpoint is deprecated and disabled with HTTP 410 Gone
        resp = self.client.post(f"/api/v1/marketplace/plans/{self.plan.id}/purchase/", {
            "amount_paid": 29.99,
            "transaction_number": "TXN-VALID-001",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_410_GONE)
        self.assertEqual(resp.data.get("code"), "ENDPOINT_DEPRECATED")

    @patch("stripe.PaymentIntent.retrieve")
    def test_stripe_payment_intent_creation(self, mock_retrieve):
        self.authenticate_client()

        create_resp = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        checkout_id = create_resp.data["data"]["checkout_id"]

        mock_retrieve.return_value = {
            "id": "pi_card_visa_test_token",
            "status": "succeeded",
            "amount_received": 2999,
            "currency": "usd",
            "metadata": {
                "user_id": str(self.client_user.id),
                "checkout_id": checkout_id
            }
        }

        # Client submits verified PaymentIntent ID
        confirm_resp = self.client.post(f"/api/v1/checkout/{checkout_id}/confirm/", {
            "payment_intent_id": "pi_card_visa_test_token",
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

        self.assertEqual(resp.status_code, status.HTTP_410_GONE)
        self.assertEqual(resp.data.get("code"), "ENDPOINT_DEPRECATED")
        self.assertFalse(Consultation.objects.filter(client=self.client_profile).exists())

    @patch("stripe.PaymentIntent.retrieve")
    def test_concurrent_slot_booking_race_condition(self, mock_retrieve):
        """
        BE-008: When two clients attempt to book the exact same consultation slot,
        the first checkout hold succeeds and the concurrent attempt is rejected
        with HTTP 409 Conflict.
        """
        self.authenticate_client()

        # Create Client 2
        client2_user = User.objects.create_user(
            username="client2_slot",
            email="client2_slot@test.com",
            password="TestPassword123!",
            role="client",
        )
        Client.objects.create(
            user=client2_user,
            country=self.country,
            goal=self.goal,
            age=30,
            weight=80.0,
            height=180.0,
            gender="female",
        )

        slot_data = {
            "appointment_date": "2026-11-20",
            "start_time": "14:00:00",
            "end_time": "15:00:00",
            "consultation_type": "advice_only",
        }

        # Client 1 creates checkout session and acquires atomic slot hold
        resp1 = self.client.post("/api/v1/checkout/create/", {
            "item_type": "CONSULTATION",
            "item_id": self.nutritionist_profile.nutritionist_id,
            "metadata": slot_data,
        }, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        checkout_id_1 = resp1.data["data"]["checkout_id"]

        # Client 2 logs in and attempts to create checkout session for the same held slot
        login2 = self.client.post("/api/v1/auth/login/", {
            "email": "client2_slot@test.com",
            "password": "TestPassword123!",
        }, format="json")
        token2 = login2.data["data"]["tokens"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token2}")

        resp2 = self.client.post("/api/v1/checkout/create/", {
            "item_type": "CONSULTATION",
            "item_id": self.nutritionist_profile.nutritionist_id,
            "metadata": slot_data,
        }, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp2.data.get("code"), "SLOT_ALREADY_BOOKED")

        # Client 1 confirms booking
        self.authenticate_client()
        mock_retrieve.return_value = {
            "id": "pi_slot_001",
            "status": "succeeded",
            "amount_received": 5000,
            "currency": "usd",
            "metadata": {"user_id": str(self.client_user.id), "checkout_id": checkout_id_1}
        }
        confirm1 = self.client.post(f"/api/v1/checkout/{checkout_id_1}/confirm/", {
            "payment_intent_id": "pi_slot_001",
            **slot_data,
        }, format="json")
        self.assertEqual(confirm1.status_code, status.HTTP_201_CREATED)

        # Verify only one consultation exists and belongs to client 1
        consultations = Consultation.objects.filter(
            nutritionist=self.nutritionist_profile,
            appointment_date="2026-11-20",
            start_time="14:00:00",
        )
        self.assertEqual(consultations.count(), 1)
        self.assertEqual(consultations.first().client, self.client_profile)
        self.assertEqual(consultations.first().status, "scheduled")

    def test_service_review_duplicate_rejected(self):
        """
        CROSS-002: A client cannot submit multiple reviews for the same service.
        Duplicate reviews return HTTP 409 with code ALREADY_REVIEWED.
        """
        self.authenticate_client()

        consultation = Consultation.objects.create(
            client=self.client_profile,
            nutritionist=self.nutritionist_profile,
            appointment_date="2026-10-01",
            start_time="10:00:00",
            end_time="11:00:00",
            status="finished",
            price_paid=50.0,
        )

        # First review succeeds
        rev1 = self.client.post("/api/v1/client/reviews/", {
            "item_type": "consultation",
            "item_id": consultation.id,
            "rating": 5,
            "comment": "Great session!",
        }, format="json")
        self.assertEqual(rev1.status_code, status.HTTP_201_CREATED)

        self.nutritionist_profile.refresh_from_db()
        self.assertEqual(self.nutritionist_profile.rating, 5.0)

        # Second review for the same consultation must fail with 409
        rev2 = self.client.post("/api/v1/client/reviews/", {
            "item_type": "consultation",
            "item_id": consultation.id,
            "rating": 1,
            "comment": "Changed my mind",
        }, format="json")
        self.assertEqual(rev2.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(rev2.data.get("code"), "ALREADY_REVIEWED")

        # Rating remains 5.0
        self.nutritionist_profile.refresh_from_db()
        self.assertEqual(self.nutritionist_profile.rating, 5.0)

    @patch("stripe.PaymentIntent.create")
    @patch("stripe.PaymentIntent.retrieve")
    def test_retried_create_after_timeout_reuses_idempotency_key(self, mock_retrieve, mock_create):
        """
        A retried create request for a usable intent reuses the same intent/idempotency key.
        Only when an intent is canceled/failed or terms change does attempt_count increment.
        """
        self.authenticate_client()

        # 1. Initial creation
        intent_1 = MagicMock(
            id="pi_retry_001",
            client_secret="pi_retry_001_secret",
            status="requires_payment_method",
            amount=2999,
            currency="usd",
            last_payment_error=None
        )
        mock_create.return_value = intent_1
        mock_retrieve.return_value = intent_1

        resp1 = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        checkout_id = resp1.data["data"]["checkout_id"]
        session = CheckoutSession.objects.get(checkout_id=checkout_id)

        self.assertEqual(session.metadata.get("attempt_count"), 1)
        self.assertEqual(mock_create.call_count, 1)
        idempotency_key_1 = mock_create.call_args[1]["idempotency_key"]
        self.assertTrue(idempotency_key_1.endswith("_1"))

        # 2. Retrying create while intent is still usable (e.g. client timed out and retries)
        resp2 = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
        session.refresh_from_db()

        # create() was NOT called again; attempt_count remains 1
        self.assertEqual(mock_create.call_count, 1)
        self.assertEqual(session.metadata.get("attempt_count"), 1)

        # 3. Existing intent becomes canceled/unusable
        intent_failed = MagicMock(
            id="pi_retry_001",
            client_secret="pi_retry_001_secret",
            status="canceled",
            amount=2999,
            currency="usd",
            last_payment_error="Payment cancelled"
        )
        intent_2 = MagicMock(
            id="pi_retry_002",
            client_secret="pi_retry_002_secret",
            status="requires_payment_method",
            amount=2999,
            currency="usd",
            last_payment_error=None
        )
        mock_retrieve.return_value = intent_failed
        mock_create.return_value = intent_2

        resp3 = self.client.post("/api/v1/checkout/create/", {
            "item_type": "MEAL_PLAN",
            "item_id": self.plan.id,
        }, format="json")
        self.assertEqual(resp3.status_code, status.HTTP_201_CREATED)
        session.refresh_from_db()

        # Now create() was called a second time with incremented attempt_count (_2)
        self.assertEqual(mock_create.call_count, 2)
        self.assertEqual(session.metadata.get("attempt_count"), 2)
        idempotency_key_2 = mock_create.call_args[1]["idempotency_key"]
        self.assertTrue(idempotency_key_2.endswith("_2"))

    @patch("stripe.PaymentIntent.cancel")
    @patch("stripe.PaymentIntent.retrieve")
    def test_cleanup_expired_checkouts_fulfills_succeeded_leaves_processing_and_cancels_abandoned(
        self, mock_retrieve, mock_cancel
    ):
        """
        cleanup_expired_checkouts management command:
        - Retrieves PaymentIntent before taking action.
        - Fulfills if PaymentIntent succeeded.
        - Leaves session pending if PaymentIntent is currently processing.
        - Cancels PaymentIntent on Stripe and expires session if abandoned.
        - Cancels stale consultation holds (>15m old).
        """
        from django.core.management import call_command

        now = timezone.now()
        past = now - datetime.timedelta(hours=2)

        # 1. Succeeded session (abandoned checkout record but user completed payment in Stripe)
        succeeded_session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type='MEAL_PLAN',
            item_id=self.plan.id,
            resolved_price=self.plan.price,
            currency='USD',
            status='pending',
            expires_at=past,
            payment_intent_id='pi_clean_succeeded_123',
        )

        # 2. Processing session (e.g. async payment method like ACH / SEPA still settling)
        processing_session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type='MEAL_PLAN',
            item_id=self.plan.id,
            resolved_price=self.plan.price,
            currency='USD',
            status='pending',
            expires_at=past,
            payment_intent_id='pi_clean_processing_123',
        )

        # 3. Abandoned session (client dropped off during card entry)
        abandoned_session = CheckoutSession.objects.create(
            user=self.client_user,
            item_type='MEAL_PLAN',
            item_id=self.plan.id,
            resolved_price=self.plan.price,
            currency='USD',
            status='pending',
            expires_at=past,
            payment_intent_id='pi_clean_abandoned_123',
        )

        # 4. Stale consultation hold (> 15 min old)
        stale_hold = Consultation.objects.create(
            client=self.client_profile,
            nutritionist=self.nutritionist_profile,
            appointment_date=datetime.date.today() + datetime.timedelta(days=7),
            start_time="09:00:00",
            end_time="10:00:00",
            status="pending_payment",
            price_paid=50.0,
            consultation_type="advice_only",
        )
        Consultation.objects.filter(id=stale_hold.id).update(
            created_at=now - datetime.timedelta(minutes=20)
        )

        def side_effect_retrieve(pi_id):
            if pi_id == 'pi_clean_succeeded_123':
                return MagicMock(id=pi_id, status='succeeded')
            elif pi_id == 'pi_clean_processing_123':
                return MagicMock(id=pi_id, status='processing')
            elif pi_id == 'pi_clean_abandoned_123':
                return MagicMock(id=pi_id, status='requires_payment_method')
            raise ValueError(f"Unknown pi_id {pi_id}")

        mock_retrieve.side_effect = side_effect_retrieve

        call_command('cleanup_expired_checkouts')

        # Assertions:
        # Succeeded session was fulfilled into confirmed
        succeeded_session.refresh_from_db()
        self.assertEqual(succeeded_session.status, 'confirmed')
        self.assertTrue(UserPlan.objects.filter(client=self.client_profile, plan=self.plan).exists())

        # Processing session was untouched (left pending)
        processing_session.refresh_from_db()
        self.assertEqual(processing_session.status, 'pending')

        # Abandoned session was expired and cancelled on Stripe
        abandoned_session.refresh_from_db()
        self.assertEqual(abandoned_session.status, 'expired')
        mock_cancel.assert_called_once_with('pi_clean_abandoned_123')

        # Stale hold was cancelled
        stale_hold.refresh_from_db()
        self.assertEqual(stale_hold.status, 'cancelled')



