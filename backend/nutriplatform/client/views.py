from datetime import date, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import  IsAuthenticated
from users.permissions import IsClient
from .models import Client, DailyProgressMetric, AICalorieLog
from .serializers import (
    ClientProfileSerializer,
    MacroTargetSerializer,
    DailyProgressSerializer,
    ManualCalorieLogSerializer,
    CalorieLogSerializer,
    UserPlanListSerializer
)
from .apiNinja import get_nutrition_data

from django.utils import timezone
from django.db import transaction

from marketplace.models import Consultation, UserPlan
from nutritionist.models import (
    Nutritionist,
    NutritionistAvailability,
    NutritionistHoliday,
    NutritionistPatient,
)
from .serializers import ConsultationBookSerializer, ClientConsultationSerializer

from marketplace.models import Consultation, UserPlan, Plan



class ClientProfileView(APIView):
    permission_classes = [IsClient]

    def get_client(self, request):
        return Client.objects.select_related('user', 'goal', 'country').get(user=request.user)

    def get(self, request):
        client = self.get_client(request)
        serializer = ClientProfileSerializer(client)
        return Response({'status': 'success', 'data': serializer.data})

    def patch(self, request):
        client     = self.get_client(request)
        serializer = ClientProfileSerializer(client, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response({'status': 'error', 'errors': serializer.errors}, status=400)

        

        serializer.save()
        return Response({'status': 'success', 'data': serializer.data})


class ProgressView(APIView):
    permission_classes = [IsClient]

    def get(self, request):
        client = Client.objects.get(user=request.user)

        # default date range: last 30 days
        end_date   = date.today()
        start_date = end_date - timedelta(days=30)

        # override with query params if provided
        if request.query_params.get('start_date'):
            start_date = request.query_params.get('start_date')
        if request.query_params.get('end_date'):
            end_date = request.query_params.get('end_date')

        logs = DailyProgressMetric.objects.filter(
            client=client,
            log_date__range=[start_date, end_date]
        ).order_by('-log_date')

        serializer = DailyProgressSerializer(logs, many=True)
        return Response({'status': 'success', 'data': serializer.data})


class MacroTargetView(APIView):
    permission_classes = [IsClient]
    def get_client(self, request):
        return Client.objects.get(user=request.user)
    def patch(self, request):
        client     = self.get_client(request)
        serializer = ClientProfileSerializer(client, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response({'status': 'error', 'errors': serializer.errors}, status=400)

        serializer.save()  # ← Client.save() fires automatically, recalculates bmi/bmr
        return Response({'status': 'success', 'data': serializer.data})
    




class ManualCalorieLogView(APIView):
    permission_classes = [IsClient]

    def post(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        serializer = ManualCalorieLogSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status":  "error",
                "message": "Validation failed",
                "errors":  serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        meal_type   = serializer.validated_data['meal_type']
        ingredients = serializer.validated_data['ingredients']

        # ── Call API Ninjas ────────────────────────────────────────────────────
        try:
            nutrition = get_nutrition_data(ingredients)
        except Exception as e:
            return Response({
                "status":  "error",
                "message": str(e),
                "code":    "NUTRITION_API_UNAVAILABLE"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # ── Save log + update daily progress atomically ────────────────────────
        with transaction.atomic():
            log = AICalorieLog.objects.create(
                client         = client,
                meal_type      = meal_type,
                entry_type     = 'manual_input',
                user_final_log = [
                    {"name": i['name'], "mass_grams": i['mass_grams']}
                    for i in ingredients
                ],
                total_calories       = nutrition['total_calories'],
                total_protein        = nutrition['total_protein'],
                total_carbs          = nutrition['total_carbs'],
                total_fats           = nutrition['total_fats'],
                status               = 'saved',
                is_validated_by_user = True,
            )

            # Update or create today's DailyProgressMetric
            today = timezone.now().date()
            progress, _ = DailyProgressMetric.objects.get_or_create(
                client   = client,
                log_date = today,
            )
            progress.total_calories_consumed = round(progress.total_calories_consumed + nutrition['total_calories'], 2)
            progress.total_protein_consumed  = round(progress.total_protein_consumed  + nutrition['total_protein'], 2)
            progress.total_carbs_consumed    = round(progress.total_carbs_consumed    + nutrition['total_carbs'], 2)
            progress.total_fats_consumed     = round(progress.total_fats_consumed     + nutrition['total_fats'], 2)
            progress.check_goal_achieved()
            progress.save()

        return Response({
            "status": "success",
            "data": {
                "log_id":         log.id,
                "meal_type":      log.meal_type,
                "total_calories": log.total_calories,
                "total_protein":  log.total_protein,
                "total_carbs":    log.total_carbs,
                "total_fats":     log.total_fats,
                "daily_progress": DailyProgressSerializer(progress).data,
            }
        }, status=status.HTTP_201_CREATED)


class CalorieLogListView(APIView):
    permission_classes = [IsClient]

    def get(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        today      = timezone.now().date()
        date_param = request.query_params.get('date', str(today))
        entry_type = request.query_params.get('entry_type', None)

        logs = AICalorieLog.objects.filter(
            client          = client,
            logged_at__date = date_param,
        )

        if entry_type in ['ai_vision', 'manual_input']:
            logs = logs.filter(entry_type=entry_type)

        logs = logs.order_by('-logged_at')
        serializer = CalorieLogSerializer(logs, many=True)

        return Response({
            "status": "success",
            "data":   serializer.data
        })
    


class ClientConsultationListView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        consultations = Consultation.objects.filter(
            client=client
        ).select_related(
            'nutritionist__user'
        ).order_by('-created_at')

        serializer = ClientConsultationSerializer(consultations, many=True)
        return Response({"status": "success", "data": serializer.data})


class ConsultationBookView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    PLATFORM_COMMISSION = 0.20

    def post(self, request):
        # Get client
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        # Validate input
        serializer = ConsultationBookSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status":  "error",
                "message": "Validation failed",
                "errors":  serializer.errors
            }, status=400)

        data = serializer.validated_data

        # Get nutritionist
        try:
            nutritionist = Nutritionist.objects.get(
                nutritionist_id = data['nutritionist_id'],
                approval_status = 'approved',
            )
        except Nutritionist.DoesNotExist:
            return Response({
                "status":  "error",
                "message": "Nutritionist not found or not approved."
            }, status=404)

        appointment_date = data['appointment_date']
        start_time       = data['start_time']
        end_time         = data['end_time']

        # ── Check holiday ──────────────────────────────────────────────────────
        if NutritionistHoliday.objects.filter(
            nutritionist = nutritionist,
            holiday_date = appointment_date,
        ).exists():
            return Response({
                "status":  "error",
                "message": "Nutritionist is on holiday on this date.",
                "code":    "SLOT_UNAVAILABLE"
            }, status=422)

        # ── Check availability for this day ────────────────────────────────────
        python_weekday = appointment_date.weekday()
        our_day        = (python_weekday + 1) % 7  # convert to Sun=0 Mon=1...

        availability = NutritionistAvailability.objects.filter(
            nutritionist = nutritionist,
            day_of_week  = our_day,
        )
        if not availability.exists():
            return Response({
                "status":  "error",
                "message": "Nutritionist is not available on this day.",
                "code":    "SLOT_UNAVAILABLE"
            }, status=422)

        # Check requested slot fits within availability window
        slot_valid = any(
            a.start_time <= start_time and a.end_time >= end_time
            for a in availability
        )
        if not slot_valid:
            return Response({
                "status":  "error",
                "message": "Requested time slot is outside nutritionist availability.",
                "code":    "SLOT_UNAVAILABLE"
            }, status=422)

        # ── Check slot not already booked ──────────────────────────────────────
        conflict = Consultation.objects.filter(
            nutritionist     = nutritionist,
            appointment_date = appointment_date,
        ).exclude(status='cancelled').filter(
            start_time__lt = end_time,
            end_time__gt   = start_time,
        ).exists()

        if conflict:
            return Response({
                "status":  "error",
                "message": "This time slot is already booked.",
                "code":    "SLOT_UNAVAILABLE"
            }, status=422)

        # ── Handle free consultation from plan ─────────────────────────────────
        is_free_from_plan = data.get('is_free_from_plan', False)
        user_plan         = None
        price_paid        = nutritionist.consultation_price or 0

        if is_free_from_plan:
            try:
                user_plan = UserPlan.objects.get(
                    id     = data['user_plan_id'],
                    client = client,
                    status = 'active',
                )
            except UserPlan.DoesNotExist:
                return Response({
                    "status":  "error",
                    "message": "User plan not found or not active."
                }, status=404)

            # Check free consultations remaining
            plan = user_plan.plan
            used = user_plan.free_consultations_used
            allowed_per_week = plan.free_consultations_per_week

            if used >= allowed_per_week:
                return Response({
                    "status":  "error",
                    "message": "No free consultations remaining from this plan.",
                    "code":    "FREE_CONSULT_EXHAUSTED"
                }, status=422)

            price_paid = 0

        # ── Create consultation ────────────────────────────────────────────────
        commission = round(price_paid * (1 - self.PLATFORM_COMMISSION), 2)

        with transaction.atomic():
            consultation = Consultation.objects.create(
                client                  = client,
                nutritionist            = nutritionist,
                appointment_date        = appointment_date,
                start_time              = start_time,
                end_time                = end_time,
                consultation_type       = data['consultation_type'],
                status                  = 'scheduled',
                price_paid              = price_paid,
                nutritionist_commission = commission,
                is_free_from_plan       = is_free_from_plan,
                user_plan               = user_plan,
            )
            from notifications.utils import notify

            # After consultation is created inside transaction.atomic():
            notify(
                recipient   = nutritionist.user,
                sender      = request.user,
                title       = 'New Consultation Booked',
                message     = f'A client booked a consultation on {appointment_date} at {start_time}.',
                target_type = 'consultation',
                target_id   = consultation.id,
            )

            # Update free consultations used
            if is_free_from_plan and user_plan:
                user_plan.free_consultations_used += 1
                user_plan.save()

            # Add to NutritionistPatient if not already there
            NutritionistPatient.objects.get_or_create(
                nutritionist = nutritionist,
                client       = client,
                defaults     = {'patient_type': 'free_consultation'}
            )

        return Response({
            "status": "success",
            "data": {
                "id":                     consultation.id,
                "status":                 consultation.status,
                "appointment_date":       consultation.appointment_date,
                "start_time":             str(consultation.start_time),
                "end_time":               str(consultation.end_time),
                "price_paid":             consultation.price_paid,
                "nutritionist_commission": consultation.nutritionist_commission,
                "zoom_link":              consultation.zoom_link,
            }
        }, status=201)


# ── User Plans ─────────────────────────────────────────────────────────────────

class UserPlanListView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        user_plans = UserPlan.objects.filter(
            client=client
        ).select_related('plan').order_by('-purchased_at')

        serializer = UserPlanListSerializer(user_plans, many=True)
        return Response({"status": "success", "data": serializer.data})


class UserPlanContentView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request, pk):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        try:
            user_plan = UserPlan.objects.select_related('plan').get(
                id=pk, client=client
            )
        except UserPlan.DoesNotExist:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        # Get day index from query param or use current
        day_index = request.query_params.get('day', user_plan.current_day_index)
        try:
            day_index = int(day_index)
        except ValueError:
            return Response({"status": "error", "message": "Invalid day index."}, status=400)

        # Validate day index
        duration = user_plan.plan.duration_days
        if day_index < 0 or day_index >= duration:
            return Response({
                "status":  "error",
                "message": f"Day index must be between 0 and {duration - 1}."
            }, status=400)

        # Get content_json
        content = user_plan.plan.content_json
        if not content:
            return Response({"status": "error", "message": "Plan has no content."}, status=404)

        # content_json is a list of day objects
        if isinstance(content, list):
            # Find the day matching day_index
            day_data = next(
                (d for d in content if d.get('day_index') == day_index),
                None
            )
            if not day_data:
                # Fallback: use list index
                try:
                    day_data = content[day_index]
                except IndexError:
                    return Response({
                        "status":  "error",
                        "message": f"No content found for day {day_index}."
                    }, status=404)
        else:
            return Response({"status": "error", "message": "Invalid plan content format."}, status=500)

        return Response({
            "status": "success",
            "data": {
                "day_index":    day_index,
                "breakfast":    day_data.get('breakfast', {}),
                "lunch":        day_data.get('lunch', {}),
                "dinner":       day_data.get('dinner', {}),
                "snacks":       day_data.get('snacks', []),
                "instructions": day_data.get('instructions', ''),
            }
        })


class UserPlanAdvanceView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def patch(self, request, pk):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        try:
            user_plan = UserPlan.objects.select_related('plan').get(
                id=pk, client=client, status='active'
            )
        except UserPlan.DoesNotExist:
            return Response({
                "status":  "error",
                "message": "Active plan not found."
            }, status=404)

        duration = user_plan.plan.duration_days

        # Check if already on last day
        if user_plan.current_day_index >= duration - 1:
            user_plan.status = 'completed'
            user_plan.save()
            return Response({
                "status": "success",
                "message": "🎉 Congratulations! You completed the plan!",
                "data": {
                    "current_day_index": user_plan.current_day_index,
                    "status":            "completed",
                    "progress_percent":  100,
                }
            })

        # Advance to next day
        user_plan.current_day_index += 1

        # Check if now completed
        if user_plan.current_day_index >= duration - 1:
            user_plan.status = 'completed'

        user_plan.save()

        progress = round((user_plan.current_day_index / duration) * 100, 1)

        return Response({
            "status": "success",
            "data": {
                "current_day_index": user_plan.current_day_index,
                "status":            user_plan.status,
                "progress_percent":  progress,
            }
        })