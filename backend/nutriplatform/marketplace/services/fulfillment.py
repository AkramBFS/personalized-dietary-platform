import logging
import datetime
from django.conf import settings
from django.db import transaction, IntegrityError
from django.utils import timezone
import stripe

from nutriplatform.middleware.rls import set_rls_context
from marketplace.models import (
    CheckoutSession,
    Plan,
    UserPlan,
    Invoice,
    Consultation,
)
from client.models import Client, PremiumSubscription
from nutritionist.models import Nutritionist, NutritionistPatient
from notifications.utils import notify

logger = logging.getLogger(__name__)
PLATFORM_COMMISSION = 0.20


def get_client_for_user(user):
    try:
        return Client.objects.get(user=user)
    except Client.DoesNotExist:
        return None


def fulfill_checkout_session(checkout_id: str, payment_ref: str, verified_amount: float, source: str = 'api') -> dict:
    """
    Unified, idempotent fulfillment service for completed checkout sessions.
    
    Security & Isolation Contract:
    - Executes inside an atomic transaction.
    - Locks the CheckoutSession with select_for_update().
    - Switches database session to OWNER CONTEXT (set_rls_context(user=session.user)).
    - All writes (UserPlan, Invoice, PremiumSubscription, Consultation) satisfy RLS WITH CHECK natively.
    - Zero staff/worker elevation is used during entitlement writing.
    - Handles consultation slot collision / expiration via automatic Stripe refund.
    """
    with transaction.atomic():
        try:
            session = CheckoutSession.objects.select_for_update().get(checkout_id=checkout_id)
        except CheckoutSession.DoesNotExist:
            logger.error(f"[Fulfillment] CheckoutSession {checkout_id} not found.")
            return {"status": "not_found", "message": "Session not found."}

        if session.status == 'confirmed':
            logger.info(f"[Fulfillment] CheckoutSession {checkout_id} already confirmed. Idempotent return.")
            return {"status": "already_confirmed", "item_type": session.item_type}

        # Check late payment on expired session
        is_late_payment = session.is_expired()
        if is_late_payment and session.status == 'expired':
            logger.warning(f"[Fulfillment] Processing late payment on expired session {checkout_id} (source: {source})")

        # Switch to OWNER CONTEXT for strict tenant isolation
        set_rls_context(user=session.user)

        client = get_client_for_user(session.user)
        if not client:
            logger.error(f"[Fulfillment] Client record for user {session.user.id} not found.")
            return {"status": "error", "message": "Client profile not found."}

        amount = float(verified_amount)
        commission_rate = PLATFORM_COMMISSION
        net_earnings = round(amount * (1 - commission_rate), 2)

        # ── Item-specific fulfillment ──────────────────────────────────────────
        if session.item_type == 'MEAL_PLAN':
            try:
                plan = Plan.objects.get(id=session.item_id)
            except Plan.DoesNotExist:
                return {"status": "error", "message": "Plan not found."}

            user_plan, _ = UserPlan.objects.get_or_create(
                client=client,
                plan=plan,
                defaults={'current_day_index': 0, 'status': 'active'}
            )

            Invoice.objects.get_or_create(
                transaction_number=payment_ref,
                defaults={
                    'client': client,
                    'nutritionist': plan.creator,
                    'total_paid': amount,
                    'refunded_amount': 0.0,
                    'commission_rate': commission_rate,
                    'net_earnings': net_earnings,
                    'item_type': 'plan',
                    'status': 'paid',
                }
            )

            NutritionistPatient.objects.get_or_create(
                nutritionist=plan.creator,
                client=client,
                defaults={'patient_type': 'from_custom_plan'}
            )

            notify(
                recipient=plan.creator.user,
                sender=session.user,
                title='New Plan Purchase',
                message=f"{client.user.username} purchased your plan: {plan.title}",
                target_type='general'
            )

        elif session.item_type == 'SUBSCRIPTION':
            plan_type = session.metadata.get('plan_type', 'monthly') if session.metadata else 'monthly'
            now = timezone.now()
            duration_days = 30 if plan_type == 'monthly' else 365
            end_date = now + datetime.timedelta(days=duration_days)

            # Expire previous active subscriptions
            PremiumSubscription.objects.filter(client=client, status='active').update(status='expired')

            PremiumSubscription.objects.create(
                client=client,
                plan_type=plan_type,
                amount_paid=amount,
                transaction_number=payment_ref,
                start_date=now,
                end_date=end_date,
                status='active',
            )

            client.is_premium = True
            client.save(update_fields=['is_premium'])

            # Record system subscription invoice if nutritionist is available or placeholder
            Invoice.objects.get_or_create(
                transaction_number=payment_ref,
                defaults={
                    'client': client,
                    'nutritionist_id': 1, # System / admin nutritionist placeholder
                    'total_paid': amount,
                    'refunded_amount': 0.0,
                    'commission_rate': 0.0,
                    'net_earnings': amount,
                    'item_type': 'subscription',
                    'status': 'paid',
                }
            )

        elif session.item_type == 'CONSULTATION':
            metadata = session.metadata or {}
            hold_id = metadata.get('consultation_hold_id')

            consultation = None
            if hold_id:
                consultation = Consultation.objects.select_for_update().filter(id=hold_id).first()

            # Slot verification: must be pending_payment
            slot_acquired = False
            if consultation and consultation.status == 'pending_payment':
                consultation.status = 'scheduled'
                consultation.price_paid = amount
                consultation.save(update_fields=['status', 'price_paid'])
                slot_acquired = True
            elif is_late_payment or not consultation:
                # If late payment or hold expired, check if nutritionist slot can be re-acquired
                nutri_id = session.item_id
                target_date = metadata.get('appointment_date')
                start_time = metadata.get('start_time')
                end_time = metadata.get('end_time')
                c_type = metadata.get('consultation_type', 'advice_only')

                if target_date and start_time and end_time:
                    try:
                        with transaction.atomic():
                            consultation = Consultation.objects.create(
                                client=client,
                                nutritionist_id=nutri_id,
                                appointment_date=target_date,
                                start_time=start_time,
                                end_time=end_time,
                                consultation_type=c_type,
                                status='scheduled',
                                price_paid=amount
                            )
                        slot_acquired = True
                    except IntegrityError:
                        slot_acquired = False

            if not slot_acquired:
                # Slot was stolen or expired: AUTO-REFUND SAFETY NET
                logger.warning(
                    f"[Fulfillment] Consultation slot conflict for session {checkout_id}. Issuing automatic refund."
                )
                session.status = 'expired'
                session.payment_intent_id = payment_ref
                session.save(update_fields=['status', 'payment_intent_id'])

                _trigger_auto_refund(payment_ref, f"refund_conflict_{session.checkout_id}")
                return {
                    "status": "conflict_refunded",
                    "message": "The selected time slot is no longer available. A full refund has been initiated."
                }

            # Consultation successfully booked: generate Invoice
            Invoice.objects.get_or_create(
                transaction_number=payment_ref,
                defaults={
                    'client': client,
                    'nutritionist': consultation.nutritionist,
                    'total_paid': amount,
                    'refunded_amount': 0.0,
                    'commission_rate': commission_rate,
                    'net_earnings': net_earnings,
                    'item_type': 'consultation_advice',
                    'status': 'paid',
                }
            )

            NutritionistPatient.objects.get_or_create(
                nutritionist=consultation.nutritionist,
                client=client,
                defaults={'patient_type': 'from_consultation'}
            )

            notify(
                recipient=consultation.nutritionist.user,
                sender=session.user,
                title='New Consultation Booked',
                message=f"{client.user.username} scheduled a consultation on {consultation.appointment_date} at {consultation.start_time}.",
                target_type='general'
            )

        # ── Finalize session ───────────────────────────────────────────────────
        session.status = 'confirmed'
        session.payment_intent_id = payment_ref
        session.save(update_fields=['status', 'payment_intent_id'])

        logger.info(f"[Fulfillment] Successfully fulfilled session {checkout_id} for user {session.user.id}")
        return {
            "status": "confirmed",
            "checkout_id": str(session.checkout_id),
            "item_type": session.item_type
        }


def _trigger_auto_refund(payment_intent_id: str, idempotency_key: str):
    """Triggers an automated refund on Stripe if payment succeeded on an unavailable slot."""
    stripe_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
    if not stripe_key or not payment_intent_id.startswith('pi_'):
        logger.info(f"[Refund Mock] Simulated refund for {payment_intent_id} (key: {idempotency_key})")
        return

    stripe.api_key = stripe_key
    try:
        stripe.Refund.create(
            payment_intent=payment_intent_id,
            idempotency_key=idempotency_key,
        )
        logger.info(f"[Refund Success] Successfully auto-refunded {payment_intent_id}")
    except stripe.error.StripeError as e:
        logger.critical(f"[Refund Failure] Failed to refund {payment_intent_id}: {str(e)}")
