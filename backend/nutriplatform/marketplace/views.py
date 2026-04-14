from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from django.db import transaction
from django.utils import timezone

import datetime

from users.permissions import IsClient
from .models import Plan, UserPlan, Invoice, Consultation
from .serializers import (
    PlanListSerializer,
    PlanDetailSerializer,
    NutritionistDirectorySerializer,
    PurchasePlanSerializer,
    UserPlanSerializer,
)
from nutritionist.models import (
    Nutritionist,
    NutritionistAvailability,
    NutritionistHoliday,
    NutritionistPatient,
    NutritionistLanguage,
)
from client.models import Client


# ── Helper ─────────────────────────────────────────────────────────────────────

PLATFORM_COMMISSION = 0.20   # 20% platform fee


# ── Browse Plans ───────────────────────────────────────────────────────────────

class MarketplacePlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        plans = Plan.objects.filter(
            status    = 'approved',
            plan_type = 'public-predefined',
        ).select_related('creator__user', 'creator__specialization', 'creator__country')

        # ── Filters ────────────────────────────────────────────────────────────
        specialization_id = request.query_params.get('specialization_id')
        min_price         = request.query_params.get('min_price')
        max_price         = request.query_params.get('max_price')
        sort              = request.query_params.get('sort', 'newest')

        if specialization_id:
            plans = plans.filter(creator__specialization_id=specialization_id)
        if min_price:
            plans = plans.filter(price__gte=float(min_price))
        if max_price:
            plans = plans.filter(price__lte=float(max_price))

        # ── Sorting ────────────────────────────────────────────────────────────
        sort_map = {
            'rating_desc': '-rating_avg',
            'price_asc':   'price',
            'price_desc':  '-price',
            'newest':      '-created_at',
        }
        plans = plans.order_by(sort_map.get(sort, '-created_at'))

        # ── Pagination ─────────────────────────────────────────────────────────
        page      = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        start     = (page - 1) * page_size
        end       = start + page_size

        total      = plans.count()
        page_plans = plans[start:end]

        serializer = PlanListSerializer(page_plans, many=True)
        return Response({
            "status": "success",
            "data": {
                "count":    total,
                "page":     page,
                "results":  serializer.data,
            }
        })


class MarketplacePlanDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            plan = Plan.objects.select_related(
                'creator__user',
                'creator__specialization',
                'creator__country',
            ).get(id=pk, status='approved')
        except Plan.DoesNotExist:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        serializer = PlanDetailSerializer(plan)
        return Response({"status": "success", "data": serializer.data})


# ── Purchase Plan ──────────────────────────────────────────────────────────────

class PlanPurchaseView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        # Get client
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        # Get plan
        try:
            plan = Plan.objects.get(id=pk, status='approved')
        except Plan.DoesNotExist:
            return Response({
                "status":  "error",
                "message": "Plan not found or not approved.",
                "code":    "PLAN_NOT_APPROVED"
            }, status=404)

        # Check already purchased
        if UserPlan.objects.filter(client=client, plan=plan).exists():
            return Response({
                "status":  "error",
                "message": "You have already purchased this plan.",
                "code":    "ALREADY_PURCHASED"
            }, status=409)

        # Validate payment fields
        serializer = PurchasePlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Validation failed",
                "errors": serializer.errors
            }, status=400)

        amount_paid        = serializer.validated_data['amount_paid']
        transaction_number = serializer.validated_data['transaction_number']

        with transaction.atomic():
            # 1 — Create UserPlan
            user_plan = UserPlan.objects.create(
                client            = client,
                plan              = plan,
                current_day_index = 0,
                status            = 'active',
            )

            # 2 — Create Invoice
            commission_rate = PLATFORM_COMMISSION
            net_earnings    = round(amount_paid * (1 - commission_rate), 2)

            Invoice.objects.create(
                client             = client,
                nutritionist       = plan.creator,
                transaction_number = transaction_number,
                total_paid         = amount_paid,
                commission_rate    = commission_rate,
                net_earnings       = net_earnings,
                item_type          = 'plan',
            )

            # 3 — Add to NutritionistPatients if not already there
            NutritionistPatient.objects.get_or_create(
                nutritionist = plan.creator,
                client       = client,
                defaults     = {'patient_type': 'from_custom_plan'}
            )

        serializer_out = UserPlanSerializer(user_plan)
        return Response({
            "status": "success",
            "data": {
                "user_plan":        serializer_out.data,
                "transaction_number": transaction_number,
                "net_earnings":     net_earnings,
            }
        }, status=201)


# ── Nutritionist Directory ─────────────────────────────────────────────────────

class NutritionistDirectoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        nutritionists = Nutritionist.objects.filter(
            approval_status = 'approved',
            user__is_active = True,
        ).select_related('user', 'specialization', 'country')

        # ── Filters ────────────────────────────────────────────────────────────
        country_id        = request.query_params.get('country_id')
        specialization_id = request.query_params.get('specialization_id')
        language_id       = request.query_params.get('language_id')
        sort              = request.query_params.get('sort', 'rating_desc')

        if country_id:
            nutritionists = nutritionists.filter(country_id=country_id)
        if specialization_id:
            nutritionists = nutritionists.filter(specialization_id=specialization_id)
        if language_id:
            nutritionists = nutritionists.filter(
                nutritionistlanguage__language_id=language_id
            ).distinct()

        # ── Sorting ────────────────────────────────────────────────────────────
        sort_map = {
            'rating_desc': '-rating',
            'price_asc':   'consultation_price',
        }
        nutritionists = nutritionists.order_by(sort_map.get(sort, '-rating'))

        serializer = NutritionistDirectorySerializer(nutritionists, many=True)
        return Response({"status": "success", "data": serializer.data})


class NutritionistPublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            nutritionist = Nutritionist.objects.select_related(
                'user', 'specialization', 'country'
            ).get(nutritionist_id=pk, approval_status='approved')
        except Nutritionist.DoesNotExist:
            return Response({"status": "error", "message": "Nutritionist not found."}, status=404)

        serializer = NutritionistDirectorySerializer(nutritionist)
        return Response({"status": "success", "data": serializer.data})


# ── Availability Check ─────────────────────────────────────────────────────────

class NutritionistAvailabilityCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        # Get nutritionist
        try:
            nutritionist = Nutritionist.objects.get(
                nutritionist_id=pk,
                approval_status='approved'
            )
        except Nutritionist.DoesNotExist:
            return Response({"status": "error", "message": "Nutritionist not found."}, status=404)

        # Get date param
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({
                "status": "error",
                "message": "date query parameter is required (YYYY-MM-DD)."
            }, status=400)

        try:
            target_date = datetime.date.fromisoformat(date_str)
        except ValueError:
            return Response({
                "status": "error",
                "message": "Invalid date format. Use YYYY-MM-DD."
            }, status=400)

        # Check if holiday
        is_holiday = NutritionistHoliday.objects.filter(
            nutritionist = nutritionist,
            holiday_date = target_date,
        ).exists()

        if is_holiday:
            return Response({
                "status": "success",
                "data": {
                    "is_holiday":      True,
                    "available_slots": [],
                }
            })

        # Get day of week (0=Sunday ... 6=Saturday)
        # Python weekday(): 0=Monday, 6=Sunday
        # Our schema: 0=Sunday, 1=Monday ... 6=Saturday
        python_weekday = target_date.weekday()  # 0=Mon, 6=Sun
        our_day        = (python_weekday + 1) % 7  # convert: Sun=0, Mon=1...

        # Get availability for this day
        availabilities = NutritionistAvailability.objects.filter(
            nutritionist = nutritionist,
            day_of_week  = our_day,
        )

        if not availabilities.exists():
            return Response({
                "status": "success",
                "data": {
                    "is_holiday":      False,
                    "available_slots": [],
                }
            })

        # Get already booked consultations on this date
        booked = Consultation.objects.filter(
            nutritionist     = nutritionist,
            appointment_date = target_date,
        ).exclude(status='cancelled').values_list('start_time', 'end_time')

        booked_slots = [(s, e) for s, e in booked]

        # Compute free slots
        free_slots = []
        for avail in availabilities:
            slot_start = avail.start_time
            slot_end   = avail.end_time

            # Check if this slot overlaps with any booking
            is_booked = any(
                not (slot_end <= b_start or slot_start >= b_end)
                for b_start, b_end in booked_slots
            )

            if not is_booked:
                free_slots.append({
                    "start_time": slot_start.strftime('%H:%M'),
                    "end_time":   slot_end.strftime('%H:%M'),
                })

        return Response({
            "status": "success",
            "data": {
                "is_holiday":      False,
                "available_slots": free_slots,
            }
        })