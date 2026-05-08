from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.db import transaction
import datetime

from .models import CheckoutSession, Plan, UserPlan, Invoice, Consultation
from client.models import Client, PremiumSubscription
from nutritionist.models import Nutritionist, NutritionistAvailability, NutritionistHoliday, NutritionistPatient
from notifications.utils import notify


PLATFORM_COMMISSION = 0.20
SESSION_EXPIRY_MINUTES = 30


def get_client(user):
    try:
        return Client.objects.get(user=user)
    except Client.DoesNotExist:
        return None


class CheckoutCreateView(APIView):
    """
    POST /checkout/create/
    Frontend calls this when user clicks any Buy button.
    Backend validates, calculates price, creates session.
    Returns only checkout_id.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        item_type = request.data.get('item_type')
        item_id   = request.data.get('item_id')

        if not item_type or not item_id:
            return Response({
                "status":  "error",
                "message": "item_type and item_id are required."
            }, status=400)

        if item_type not in ['MEAL_PLAN', 'CONSULTATION', 'SUBSCRIPTION']:
            return Response({
                "status":  "error",
                "message": "item_type must be MEAL_PLAN, CONSULTATION, or SUBSCRIPTION."
            }, status=400)

        client = get_client(request.user)
        if not client:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        # ── Resolve item and price ─────────────────────────────────────────────
        metadata       = {}
        resolved_price = 0

        if item_type == 'MEAL_PLAN':
            try:
                plan = Plan.objects.get(id=item_id, status='approved')
            except Plan.DoesNotExist:
                return Response({"status": "error", "message": "Plan not found."}, status=404)

            # Check already purchased
            if UserPlan.objects.filter(client=client, plan=plan).exists():
                return Response({
                    "status":  "error",
                    "message": "You already own this plan.",
                    "code":    "ALREADY_PURCHASED"
                }, status=409)

            resolved_price = plan.price or 0
            metadata = {
                "plan_title":    plan.title,
                "duration_days": plan.duration_days,
                "nutritionist":  plan.creator.user.username,
            }

        elif item_type == 'CONSULTATION':
            # item_id is nutritionist_id for consultations
            try:
                nutritionist = Nutritionist.objects.get(
                    nutritionist_id=item_id,
                    approval_status='approved'
                )
            except Nutritionist.DoesNotExist:
                return Response({"status": "error", "message": "Nutritionist not found."}, status=404)

            resolved_price = nutritionist.consultation_price or 0
            metadata = {
                "nutritionist_name":  nutritionist.user.username,
                "consultation_price": resolved_price,
            }

        elif item_type == 'SUBSCRIPTION':
            # item_id is the plan_type: 1=monthly, 2=yearly
            plan_type = 'monthly' if str(item_id) == '1' else 'yearly'
            resolved_price = 9.99 if plan_type == 'monthly' else 99.99
            metadata = {
                "plan_type":    plan_type,
                "duration_days": 30 if plan_type == 'monthly' else 365,
            }

        from django.utils import timezone
        expires_at = timezone.now() + datetime.timedelta(minutes=SESSION_EXPIRY_MINUTES)

        session = CheckoutSession.objects.create(
            user           = request.user,
            item_type      = item_type,
            item_id        = item_id,
            resolved_price = resolved_price,
            status         = 'pending',
            expires_at     = expires_at,
            metadata       = metadata,
        )

        return Response({
            "status": "success",
            "data": {
                "checkout_id": str(session.checkout_id),
                "expires_at":  session.expires_at,
            }
        }, status=201)


class CheckoutDetailView(APIView):
    """
    GET /checkout/{checkout_id}/
    Payment page fetches this to display summary.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, checkout_id):
        try:
            session = CheckoutSession.objects.get(
                checkout_id = checkout_id,
                user        = request.user,
            )
        except CheckoutSession.DoesNotExist:
            return Response({"status": "error", "message": "Checkout session not found."}, status=404)

        if session.status == 'confirmed':
            return Response({
                "status":  "error",
                "message": "This checkout has already been completed.",
                "code":    "ALREADY_CONFIRMED"
            }, status=409)

        if session.is_expired():
            session.status = 'expired'
            session.save()
            return Response({
                "status":  "error",
                "message": "This checkout session has expired. Please start again.",
                "code":    "SESSION_EXPIRED"
            }, status=410)

        # Build human-readable summary for payment page
        type_labels = {
            'MEAL_PLAN':    'Meal Plan',
            'CONSULTATION': 'Consultation',
            'SUBSCRIPTION': 'Premium Subscription',
        }

        return Response({
            "status": "success",
            "data": {
                "checkout_id":  str(session.checkout_id),
                "type":         session.item_type,
                "type_label":   type_labels.get(session.item_type, ''),
                "price":        session.resolved_price,
                "currency":     session.currency,
                "expires_at":   session.expires_at,
                "details":      session.metadata,
            }
        })


class CheckoutConfirmView(APIView):
    """
    POST /checkout/{checkout_id}/confirm/
    Frontend sends transaction_number after payment.
    Backend routes internally to correct purchase logic.
    Frontend never decides which endpoint to call.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, checkout_id):
        try:
            session = CheckoutSession.objects.get(
                checkout_id = checkout_id,
                user        = request.user,
                status      = 'pending',
            )
        except CheckoutSession.DoesNotExist:
            return Response({
                "status":  "error",
                "message": "Checkout session not found or already used."
            }, status=404)

        if session.is_expired():
            session.status = 'expired'
            session.save()
            return Response({
                "status":  "error",
                "message": "Checkout session expired. Please start again.",
                "code":    "SESSION_EXPIRED"
            }, status=410)

        transaction_number = request.data.get('transaction_number')
        if not transaction_number:
            return Response({
                "status":  "error",
                "message": "transaction_number is required."
            }, status=400)

        client = get_client(request.user)
        if not client:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        # ── Route internally based on item_type ────────────────────────────────
        # Frontend NEVER sees this logic — it only sends checkout_id

        with transaction.atomic():

            if session.item_type == 'MEAL_PLAN':
                result = self._confirm_plan(
                    session, client, transaction_number
                )

            elif session.item_type == 'CONSULTATION':
                # For consultations, additional booking details are required
                result = self._confirm_consultation(
                    session, client, request.data, transaction_number
                )

            elif session.item_type == 'SUBSCRIPTION':
                result = self._confirm_subscription(
                    session, client, transaction_number
                )

            else:
                return Response({
                    "status":  "error",
                    "message": "Unknown item type."
                }, status=400)

            # Mark session as confirmed
            session.status = 'confirmed'
            session.save()

        return Response({
            "status":  "success",
            "message": "Payment confirmed successfully.",
            "data":    result,
        }, status=201)

    # ── Internal execution methods ─────────────────────────────────────────────

    def _confirm_plan(self, session, client, transaction_number):
        plan = Plan.objects.get(id=session.item_id)

        user_plan = UserPlan.objects.create(
            client            = client,
            plan              = plan,
            current_day_index = 0,
            status            = 'active',
        )

        net_earnings = round(session.resolved_price * (1 - PLATFORM_COMMISSION), 2)

        Invoice.objects.create(
            client             = client,
            nutritionist       = plan.creator,
            transaction_number = transaction_number,
            total_paid         = session.resolved_price,
            commission_rate    = PLATFORM_COMMISSION,
            net_earnings       = net_earnings,
            item_type          = 'plan',
        )

        NutritionistPatient.objects.get_or_create(
            nutritionist = plan.creator,
            client       = client,
            defaults     = {'patient_type': 'from_custom_plan'}
        )

        notify(
            recipient   = plan.creator.user,
            sender      = client.user,
            title       = 'New Plan Purchase',
            message     = f'{client.user.username} purchased your plan: {plan.title}',
            target_type = 'plan',
            target_id   = plan.id,
        )

        return {
            "type":       "MEAL_PLAN",
            "user_plan_id": user_plan.id,
            "plan_title": plan.title,
        }

    def _confirm_consultation(self, session, client, data, transaction_number):
        nutritionist = Nutritionist.objects.get(nutritionist_id=session.item_id)

        appointment_date  = data.get('appointment_date')
        start_time        = data.get('start_time')
        end_time          = data.get('end_time')
        consultation_type = data.get('consultation_type', 'advice_only')

        if not all([appointment_date, start_time, end_time]):
            raise ValueError("appointment_date, start_time, end_time are required for consultation.")

        commission = round(session.resolved_price * (1 - PLATFORM_COMMISSION), 2)

        consultation = Consultation.objects.create(
            client                  = client,
            nutritionist            = nutritionist,
            appointment_date        = appointment_date,
            start_time              = start_time,
            end_time                = end_time,
            consultation_type       = consultation_type,
            status                  = 'scheduled',
            price_paid              = session.resolved_price,
            nutritionist_commission = commission,
        )

        NutritionistPatient.objects.get_or_create(
            nutritionist = nutritionist,
            client       = client,
            defaults     = {'patient_type': 'free_consultation'}
        )

        notify(
            recipient   = nutritionist.user,
            sender      = client.user,
            title       = 'New Consultation Booked',
            message     = f'{client.user.username} booked a consultation on {appointment_date}',
            target_type = 'consultation',
            target_id   = consultation.id,
        )

        return {
            "type":            "CONSULTATION",
            "consultation_id": consultation.id,
            "appointment_date": appointment_date,
        }

    def _confirm_subscription(self, session, client, transaction_number):
        import datetime
        from django.utils import timezone

        plan_type = session.metadata.get('plan_type', 'monthly')
        days      = session.metadata.get('duration_days', 30)

        # Expire existing active subscriptions
        PremiumSubscription.objects.filter(
            client=client, status='active'
        ).update(status='expired')

        subscription = PremiumSubscription.objects.create(
            client             = client,
            plan_type          = plan_type,
            amount_paid        = session.resolved_price,
            transaction_number = transaction_number,
            start_date         = timezone.now(),
            end_date           = timezone.now() + datetime.timedelta(days=days),
            status             = 'active',
        )

        client.is_premium = True
        client.save()

        return {
            "type":         "SUBSCRIPTION",
            "plan_type":    plan_type,
            "end_date":     subscription.end_date,
        }