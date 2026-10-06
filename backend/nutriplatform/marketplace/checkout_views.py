import logging
import datetime
import uuid
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from django.db import transaction, connection, IntegrityError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.exceptions import ValidationError
import stripe

from .models import (
    CheckoutSession,
    Plan,
    UserPlan,
    Invoice,
    Consultation,
    StripeEventLog,
)
from client.models import Client, PremiumSubscription
from nutritionist.models import Nutritionist
from .services.fulfillment import fulfill_checkout_session
from . import stripe_utils

logger = logging.getLogger(__name__)

PLATFORM_COMMISSION = 0.20
SESSION_EXPIRY_MINUTES_DEFAULT = 30
SESSION_EXPIRY_MINUTES_CONSULTATION = 15


def get_client(user):
    try:
        return Client.objects.get(user=user)
    except Client.DoesNotExist:
        return None


class CheckoutCreateView(APIView):
    """
    POST /checkout/create/
    Frontend calls this when user initiates purchase.
    Backend resolves authoritative price, acquires consultation hold if applicable,
    initializes or reuses Stripe PaymentIntent, and returns client_secret.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        item_type = request.data.get('item_type')
        item_id   = request.data.get('item_id')

        if not item_type or not item_id:
            return Response({
                "status":  "error",
                "message": "item_type and item_id are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        if item_type not in ['MEAL_PLAN', 'CONSULTATION', 'SUBSCRIPTION']:
            return Response({
                "status":  "error",
                "message": "item_type must be MEAL_PLAN, CONSULTATION, or SUBSCRIPTION."
            }, status=status.HTTP_400_BAD_REQUEST)

        client = get_client(request.user)
        if not client:
            return Response({"status": "error", "message": "Client profile not found."}, status=404)
        if client.is_banned:
            return Response({
                "status": "error",
                "message": "Account is suspended.",
                "code": "ACCOUNT_BANNED"
            }, status=403)

        metadata = {}
        resolved_price = 0.0
        ttl_minutes = SESSION_EXPIRY_MINUTES_DEFAULT

        # ── Item Resolution ────────────────────────────────────────────────────
        if item_type == 'MEAL_PLAN':
            try:
                plan = Plan.objects.get(id=item_id, status='approved')
            except Plan.DoesNotExist:
                return Response({"status": "error", "message": "Plan not found."}, status=404)

            if UserPlan.objects.filter(client=client, plan=plan).exists():
                return Response({
                    "status":  "error",
                    "message": "You already own this plan.",
                    "code":    "ALREADY_PURCHASED"
                }, status=status.HTTP_409_CONFLICT)

            resolved_price = float(plan.price or 0.0)
            metadata = {
                "plan_title":    plan.title,
                "duration_days": plan.duration_days,
                "nutritionist":  plan.creator.user.username,
            }

        elif item_type == 'CONSULTATION':
            ttl_minutes = SESSION_EXPIRY_MINUTES_CONSULTATION
            try:
                nutritionist = Nutritionist.objects.get(
                    nutritionist_id=item_id,
                    approval_status='approved'
                )
            except Nutritionist.DoesNotExist:
                return Response({"status": "error", "message": "Nutritionist not found."}, status=404)

            resolved_price = float(nutritionist.consultation_price or 0.0)
            incoming_meta = request.data.get('metadata')
            if not isinstance(incoming_meta, dict):
                incoming_meta = {}

            target_date = incoming_meta.get('appointment_date')
            start_time  = incoming_meta.get('start_time')
            end_time    = incoming_meta.get('end_time')
            c_type      = incoming_meta.get('consultation_type', 'advice_only')

            if not target_date or not start_time or not end_time:
                return Response({
                    "status": "error",
                    "message": "appointment_date, start_time, and end_time are required for consultation bookings.",
                    "code": "MISSING_APPOINTMENT_DETAILS"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Atomically acquire hold via SECURITY DEFINER function
            hold_id = None
            if connection.vendor == 'postgresql':
                with connection.cursor() as cur:
                    cur.execute(
                        "SELECT hold_id, status_code FROM create_consultation_hold(%s, %s, %s, %s, %s, %s);",
                        [
                            nutritionist.nutritionist_id,
                            target_date,
                            start_time,
                            end_time,
                            c_type,
                            resolved_price
                        ]
                    )
                    row = cur.fetchone()
                    hold_id = row[0] if row else None
                    hold_status = row[1] if row else 'SLOT_UNAVAILABLE'

                if hold_status == 'CAP_REACHED':
                    return Response({
                        "status": "error",
                        "message": "You have reached the maximum number of concurrent pending consultation holds (3). Please complete existing bookings or wait for holds to expire.",
                        "code": "HOLD_CAP_EXCEEDED"
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            else:
                try:
                    hold = Consultation.objects.create(
                        client=client,
                        nutritionist=nutritionist,
                        appointment_date=target_date,
                        start_time=start_time,
                        end_time=end_time,
                        consultation_type=c_type,
                        price_paid=resolved_price,
                        status='pending_payment'
                    )
                    hold_id = hold.id
                except IntegrityError:
                    hold_id = None

            if not hold_id:
                return Response({
                    "status": "error",
                    "message": "This time slot is no longer available. Please select another slot.",
                    "code": "SLOT_ALREADY_BOOKED"
                }, status=status.HTTP_409_CONFLICT)

            metadata = {
                "nutritionist_name":    nutritionist.user.username,
                "consultation_price":   resolved_price,
                "consultation_hold_id": hold_id,
                "appointment_date":     str(target_date),
                "start_time":           str(start_time),
                "end_time":             str(end_time),
                "consultation_type":    c_type,
            }

        elif item_type == 'SUBSCRIPTION':
            plan_type = 'monthly' if str(item_id) == '1' else 'yearly'
            tier_code = 'pro_monthly' if plan_type == 'monthly' else 'pro_yearly'
            from admin_panel.models import SubscriptionTierPricing
            tier = SubscriptionTierPricing.objects.filter(tier_code=tier_code).first()
            if tier:
                resolved_price = float(tier.price)
            else:
                resolved_price = 9.99 if plan_type == 'monthly' else 89.99

            metadata = {
                "plan_type":     plan_type,
                "duration_days": 30 if plan_type == 'monthly' else 365,
            }

        now = timezone.now()
        expires_at = now + datetime.timedelta(minutes=ttl_minutes)

        # ── Reuse Existing Valid Session or Create New ─────────────────────────
        existing_session = CheckoutSession.objects.filter(
            user=request.user,
            item_type=item_type,
            item_id=item_id,
            status='pending'
        ).first()

        if existing_session and not existing_session.is_expired():
            session = existing_session
            session.metadata = metadata
            session.expires_at = expires_at
            session.save(update_fields=['metadata', 'expires_at'])
        else:
            session = CheckoutSession.objects.create(
                user           = request.user,
                item_type      = item_type,
                item_id        = item_id,
                resolved_price = resolved_price,
                status         = 'pending',
                expires_at     = expires_at,
                metadata       = metadata,
            )

        # ── Handle Zero-Price Entitlements Immediately ─────────────────────────
        if resolved_price <= 0.0:
            fulfillment_result = fulfill_checkout_session(
                str(session.checkout_id),
                f"TXN-FREE-{session.checkout_id.hex[:10].upper()}",
                0.0,
                source='free_checkout'
            )
            return Response({
                "status": "success",
                "data": {
                    "checkout_id": str(session.checkout_id),
                    "status": "confirmed",
                    "is_free": True,
                    "fulfillment": fulfillment_result,
                }
            }, status=status.HTTP_201_CREATED)

        # ── Initialize or Reuse Stripe PaymentIntent ───────────────────────────
        stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
        publishable_key = getattr(settings, 'STRIPE_PUBLISHABLE_KEY', '')
        client_secret = None
        payment_intent_id = session.payment_intent_id
        amount_cents = int(round(Decimal(str(session.resolved_price)) * 100))

        # Track per-attempt idempotency counter
        curr_meta = session.metadata or {}
        attempt_count = int(curr_meta.get('attempt_count', 0))
        if attempt_count == 0:
            attempt_count = 1
            curr_meta['attempt_count'] = attempt_count
            session.metadata = curr_meta
            session.save(update_fields=['metadata'])

        if stripe_key:
            stripe.api_key = stripe_key
            try:
                if payment_intent_id:
                    try:
                        existing_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                        # If existing intent already succeeded, fulfill immediately rather than double-charging
                        if getattr(existing_intent, 'status', None) == 'succeeded' and getattr(existing_intent, 'amount', None) == amount_cents:
                            fulfillment_result = fulfill_checkout_session(
                                str(session.checkout_id),
                                existing_intent.id,
                                session.resolved_price,
                                source='client_create_intent_already_succeeded'
                            )
                            session.refresh_from_db()
                            return Response({
                                "status": "success",
                                "message": "Payment already completed and processed.",
                                "data": {
                                    "checkout_id": str(session.checkout_id),
                                    "status": session.status,
                                    "fulfillment": fulfillment_result
                                }
                            }, status=status.HTTP_200_OK)

                        # Verify status, amount, and currency of existing intent match snapshot
                        if (existing_intent.status in ('requires_payment_method', 'requires_confirmation', 'requires_action')
                                and getattr(existing_intent, 'amount', None) == amount_cents
                                and (getattr(existing_intent, 'currency', '') or '').lower() == (session.currency or 'usd').lower()
                                and not getattr(existing_intent, 'last_payment_error', None)):
                            # Stored intent is still usable: reuse it without incrementing attempt_count
                            client_secret = existing_intent.client_secret
                        else:
                            # Stored intent is unusable (failed, cancelled, amount/currency changed)
                            attempt_count += 1
                            curr_meta['attempt_count'] = attempt_count
                            session.metadata = curr_meta
                            session.save(update_fields=['metadata'])
                            client_secret = None
                    except stripe.error.InvalidRequestError as e:
                        logger.warning(f"[Stripe] Invalid PaymentIntent {payment_intent_id} on retrieve: {e}")
                        attempt_count += 1
                        curr_meta['attempt_count'] = attempt_count
                        session.metadata = curr_meta
                        session.save(update_fields=['metadata'])
                        client_secret = None
                    except stripe.error.StripeError as e:
                        logger.error(f"[Stripe] Error retrieving PaymentIntent {payment_intent_id}: {e}")
                        client_secret = None

                if not client_secret:
                    intent = stripe.PaymentIntent.create(
                        amount=amount_cents,
                        currency=(session.currency or 'usd').lower(),
                        metadata={
                            'checkout_id': str(session.checkout_id),
                            'user_id': str(request.user.id),
                        },
                        idempotency_key=f"checkout_{session.checkout_id}_{attempt_count}"
                    )
                    session.payment_intent_id = intent.id
                    session.save(update_fields=['payment_intent_id'])
                    client_secret = intent.client_secret
            except stripe.error.StripeError as e:
                logger.error(f"[Stripe] PaymentIntent creation failed: {e}")
                return Response({
                    "status": "error",
                    "message": "Payment provider temporarily unavailable. Please try again later.",
                    "code": "PAYMENT_GATEWAY_ERROR"
                }, status=status.HTTP_502_BAD_GATEWAY)

        elif getattr(settings, 'TESTING', False) or getattr(settings, 'PAYMENTS_MODE', 'stripe') == 'fake':
            # Deterministic test token for offline environments
            test_pi = f"pi_test_succeeded_{session.checkout_id.hex[:12]}"
            session.payment_intent_id = test_pi
            session.save(update_fields=['payment_intent_id'])
            client_secret = f"{test_pi}_secret_test"
        else:
            return Response({
                "status": "error",
                "message": "Payment processing is currently unavailable.",
                "code": "PAYMENTS_UNAVAILABLE"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({
            "status": "success",
            "data": {
                "checkout_id":     str(session.checkout_id),
                "client_secret":   client_secret,
                "publishable_key": publishable_key,
                "price":           session.resolved_price,
                "currency":        session.currency,
                "expires_at":      session.expires_at,
            }
        }, status=status.HTTP_201_CREATED)


class CheckoutDetailView(APIView):
    """
    GET /checkout/{checkout_id}/
    Payment page fetches this to display summary.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, checkout_id):
        try:
            session = CheckoutSession.objects.get(checkout_id=checkout_id)
        except CheckoutSession.DoesNotExist:
            return Response({"status": "error", "message": "Checkout session not found."}, status=404)

        if session.user_id != request.user.id:
            return Response({"status": "error", "message": "Checkout session not found."}, status=404)

        if session.status == 'confirmed':
            return Response({
                "status":  "error",
                "message": "This checkout has already been completed.",
                "code":    "ALREADY_CONFIRMED"
            }, status=status.HTTP_409_CONFLICT)

        if session.status == 'needs_review':
            return Response({
                "status": "warning",
                "message": "Your payment is currently under review by our billing team. Please contact support or check your email for updates.",
                "code": "PAYMENT_UNDER_REVIEW",
                "data": {
                    "checkout_id": str(session.checkout_id),
                    "status": "needs_review",
                    "price": session.resolved_price,
                    "currency": session.currency,
                }
            }, status=status.HTTP_200_OK)

        if session.is_expired():
            session.status = 'expired'
            session.save(update_fields=['status'])
            return Response({
                "status":  "error",
                "message": "This checkout session has expired. Please start again.",
                "code":    "SESSION_EXPIRED"
            }, status=status.HTTP_410_GONE)

        type_labels = {
            'MEAL_PLAN':    'Meal Plan',
            'CONSULTATION': 'Consultation',
            'SUBSCRIPTION': 'Premium Subscription',
        }

        client_secret = None
        if session.payment_intent_id:
            stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
            if stripe_key:
                try:
                    stripe.api_key = stripe_key
                    intent = stripe.PaymentIntent.retrieve(session.payment_intent_id)
                    client_secret = getattr(intent, 'client_secret', None)
                except Exception:
                    client_secret = None
            elif getattr(settings, 'TESTING', False) or getattr(settings, 'PAYMENTS_MODE', 'stripe') == 'fake':
                client_secret = f"{session.payment_intent_id}_secret_test"

        return Response({
            "status": "success",
            "data": {
                "checkout_id":     str(session.checkout_id),
                "client_secret":   client_secret,
                "publishable_key": getattr(settings, 'STRIPE_PUBLISHABLE_KEY', ''),
                "type":            session.item_type,
                "type_label":      type_labels.get(session.item_type, ''),
                "price":           session.resolved_price,
                "currency":        session.currency,
                "expires_at":      session.expires_at,
                "details":         session.metadata,
            }
        })


class CheckoutConfirmView(APIView):
    """
    POST /checkout/{checkout_id}/confirm/
    Frontend confirms payment with authoritative Stripe payment_intent_id.
    All unearned transaction token bypasses are rejected.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, checkout_id):
        try:
            session = CheckoutSession.objects.get(checkout_id=checkout_id)
        except CheckoutSession.DoesNotExist:
            return Response({"status": "error", "message": "Checkout session not found."}, status=404)

        if session.user_id != request.user.id:
            return Response({"status": "error", "message": "Checkout session not found."}, status=404)

        client = get_client(request.user)
        if client and getattr(client, 'is_banned', False):
            return Response({
                "status": "error",
                "message": "Account is suspended.",
                "code": "ACCOUNT_BANNED"
            }, status=status.HTTP_403_FORBIDDEN)

        if session.status == 'confirmed':
            return Response({
                "status": "success",
                "message": "Payment already confirmed.",
                "data": {"status": "confirmed", "checkout_id": str(session.checkout_id)}
            }, status=status.HTTP_200_OK)

        if session.status == 'needs_review':
            return Response({
                "status": "error",
                "message": "This checkout session is flagged for billing review. Please contact support.",
                "code": "PAYMENT_UNDER_REVIEW"
            }, status=status.HTTP_400_BAD_REQUEST)

        if session.is_expired():
            payment_intent_id = request.data.get('payment_intent_id') or request.data.get('transaction_number')
            if payment_intent_id:
                try:
                    verified_intent = stripe_utils.verify_stripe_payment_intent(
                        payment_intent_id=payment_intent_id,
                        expected_amount=session.resolved_price,
                        expected_currency=session.currency or 'usd',
                        expected_user_id=request.user.id,
                        expected_checkout_id=str(session.checkout_id)
                    )
                    fulfillment_result = fulfill_checkout_session(
                        checkout_id=str(session.checkout_id),
                        payment_ref=payment_intent_id,
                        verified_amount=session.resolved_price,
                        source='client_confirm_expired'
                    )
                    session.refresh_from_db()
                    return Response({
                        "status": "success",
                        "message": "Payment verified and processed.",
                        "data": {
                            "status": session.status,
                            "checkout_id": str(session.checkout_id),
                            "fulfillment": fulfillment_result
                        }
                    }, status=status.HTTP_200_OK)
                except Exception:
                    pass

            session.status = 'expired'
            session.save(update_fields=['status'])
            return Response({
                "status":  "error",
                "message": "Checkout session expired. Please start again.",
                "code":    "SESSION_EXPIRED"
            }, status=status.HTTP_410_GONE)

        payment_intent_id = request.data.get('payment_intent_id') or request.data.get('transaction_number')
        if not payment_intent_id:
            return Response({
                "status": "error",
                "message": "payment_intent_id is required. Unverified payment identifiers are not accepted.",
                "code": "PAYMENT_INTENT_REQUIRED"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check duplicate payment intent reuse
        if Invoice.objects.filter(transaction_number=payment_intent_id).exists():
            return Response({
                "status": "error",
                "message": "Transaction number already used.",
                "code": "TRANSACTION_ALREADY_USED"
            }, status=status.HTTP_409_CONFLICT)

        # ── Cryptographic / Stripe Verification ────────────────────────────────
        try:
            verified_intent = stripe_utils.verify_stripe_payment_intent(
                payment_intent_id=payment_intent_id,
                expected_amount=session.resolved_price,
                expected_currency=session.currency or 'usd',
                expected_user_id=request.user.id,
                expected_checkout_id=str(session.checkout_id)
            )
        except ValidationError as e:
            detail = e.detail if hasattr(e, 'detail') else str(e)
            return Response({
                "status": "error",
                "message": detail if isinstance(detail, str) else detail[0],
                "code": "PAYMENT_VERIFICATION_FAILED"
            }, status=status.HTTP_400_BAD_REQUEST)

        # ── Unified Idempotent Fulfillment ─────────────────────────────────────
        fulfillment_result = fulfill_checkout_session(
            checkout_id=str(session.checkout_id),
            payment_ref=payment_intent_id,
            verified_amount=session.resolved_price,
            source='client_confirm'
        )

        if fulfillment_result.get("status") == "conflict_refunded":
            return Response(fulfillment_result, status=status.HTTP_409_CONFLICT)

        return Response({
            "status":  "success",
            "message": "Payment confirmed successfully.",
            "data":    fulfillment_result,
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    POST /checkout/webhook/
    Authoritative Stripe fulfillment webhook handler.
    Validates cryptographic HMAC signature, logs events idempotently,
    and fulfills or refunds purchases atomically.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        if not sig_header:
            return Response({"status": "error", "message": "Missing Stripe-Signature header."}, status=400)

        try:
            event = stripe_utils.construct_stripe_event(request.body, sig_header)
        except ValidationError as e:
            return Response({"status": "error", "message": str(e.detail)}, status=400)

        if hasattr(event, 'to_dict'):
            event = event.to_dict()

        event_id = event.get('id')
        if not event_id:
            obj_id = event.get('data', {}).get('object', {}).get('id')
            event_id = f"evt_{obj_id}" if obj_id else f"evt_{uuid.uuid4().hex}"

        event_type = event.get('type')

        with transaction.atomic():
            # 1. Event Idempotency Check
            if StripeEventLog.objects.filter(event_id=event_id).exists():
                return Response({"status": "success", "received": True, "detail": "Already processed."})
            StripeEventLog.objects.create(event_id=event_id, event_type=event_type)

            # 2. Event Routing
            if event_type == 'payment_intent.succeeded':
                intent = event['data']['object']
                intent_id = intent.get('id')
                metadata = intent.get('metadata') or {}
                checkout_id = metadata.get('checkout_id')

                session = None
                if intent_id:
                    session = CheckoutSession.objects.filter(payment_intent_id=intent_id).first()
                if not session and checkout_id:
                    session = CheckoutSession.objects.filter(checkout_id=checkout_id).first()

                if not session:
                    logger.warning(f"[Webhook] No session matched for payment_intent {intent_id}")
                    return Response({"status": "success", "received": True, "detail": "Session not found."})

                amount_received_cents = intent.get('amount_received', 0)
                expected_cents = int(round(Decimal(str(session.resolved_price)) * 100))
                if amount_received_cents < expected_cents:
                    logger.error(
                        f"[ADMIN_ALERT] Underpaid intent {intent_id}: received {amount_received_cents} cents, "
                        f"expected {expected_cents} cents. Setting session {session.checkout_id} to needs_review."
                    )
                    session.status = 'needs_review'
                    session.payment_intent_id = intent_id
                    session.save(update_fields=['status', 'payment_intent_id'])
                    return Response({
                        "status": "ignored",
                        "received": True,
                        "detail": "Amount underpaid; session marked needs_review."
                    }, status=status.HTTP_200_OK)

                amount_received = amount_received_cents / 100.0
                fulfill_checkout_session(
                    str(session.checkout_id),
                    intent_id,
                    amount_received,
                    source='webhook'
                )

            elif event_type == 'charge.refunded':
                charge = event['data']['object']
                intent_id = charge.get('payment_intent')
                amount_refunded = (charge.get('amount_refunded', 0)) / 100.0
                total_amount = (charge.get('amount', 0)) / 100.0

                invoice = Invoice.objects.filter(transaction_number=intent_id).first()
                if invoice:
                    invoice.refunded_amount = amount_refunded
                    if amount_refunded >= total_amount:
                        invoice.status = 'refunded'
                        # Revoke entitlements
                        if invoice.item_type == 'subscription':
                            PremiumSubscription.objects.filter(transaction_number=intent_id).update(status='cancelled')
                            invoice.client.is_premium = False
                            invoice.client.save(update_fields=['is_premium'])
                        elif invoice.item_type == 'plan':
                            UserPlan.objects.filter(client=invoice.client).update(status='refunded')
                        elif invoice.item_type in ('consultation_advice', 'consultation_custom'):
                            Consultation.objects.filter(
                                client=invoice.client,
                                nutritionist=invoice.nutritionist,
                                price_paid__gt=0
                            ).update(status='cancelled')
                    else:
                        invoice.status = 'partially_refunded'
                    invoice.save(update_fields=['refunded_amount', 'status'])
                    logger.info(f"[Webhook] Recorded refund for transaction {intent_id} (${amount_refunded})")

            elif event_type == 'charge.dispute.created':
                dispute = event['data']['object']
                charge_id = dispute.get('charge')
                intent_id = dispute.get('payment_intent')
                logger.critical(f"[Webhook] Charge dispute created! Charge: {charge_id}, Intent: {intent_id}")
                if intent_id:
                    Invoice.objects.filter(transaction_number=intent_id).update(status='disputed')

            elif event_type == 'payment_intent.payment_failed':
                intent = event['data']['object']
                intent_id = intent.get('id')
                session = CheckoutSession.objects.filter(payment_intent_id=intent_id).first()
                if session:
                    session.status = 'failed'
                    session.save(update_fields=['status'])
                    # If consultation hold was reserved, cancel it to free the slot
                    hold_id = session.metadata.get('consultation_hold_id') if session.metadata else None
                    if hold_id:
                        Consultation.objects.filter(id=hold_id, status='pending_payment').update(status='cancelled')

        return Response({"status": "success", "received": True})