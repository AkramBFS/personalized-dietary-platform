import uuid
from datetime import date, timedelta
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from users.permissions import IsClient
from .models import Client, DailyProgressMetric, AICalorieLog
from .serializers import (
    ClientProfileSerializer,
    MacroTargetSerializer,
    DailyProgressSerializer,
    ManualCalorieLogSerializer,
    CalorieLogSerializer,
    UserPlanListSerializer,
    ServiceReviewSerializer,
    PlanRatingSerializer,
    CreateFeedbackSerializer,
    AICalorieConfirmSerializer,
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
from marketplace.models import ServiceReview, PlanRating
from community.models import FeedbackToAdmin
from users.permissions import IsPremiumClient
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.files.storage import default_storage
from utils.upload_security import MAX_UPLOAD_SIZE_GENERAL, sanitize_image_upload, store_bytes
from django.utils import timezone


def _ensure_aware(dt):
    if dt is None:
        return dt
    if timezone.is_naive(dt):
        return timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


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

        # Avatar upload: sanitized in memory first, so an invalid file rejects the whole request
        # and nothing is written. The URL is never accepted from the client (read-only field).
        photo = request.FILES.get('profile_photo') or request.FILES.get('avatar')
        sanitized = None
        if photo:
            try:
                sanitized = sanitize_image_upload(photo, MAX_UPLOAD_SIZE_GENERAL, field='profile_photo')
            except DRFValidationError as exc:
                detail = exc.detail.get('profile_photo') if isinstance(exc.detail, dict) else exc.detail
                return Response({'status': 'error', 'errors': {'profile_photo': [str(detail)]}}, status=400)

        new_path = None
        try:
            with transaction.atomic():
                if sanitized:
                    new_path = store_bytes(sanitized.data, 'profiles/clients', sanitized.ext)
                    serializer.save(profile_photo_url=new_path)
                else:
                    serializer.save()
        except Exception:
            if new_path:
                try:
                    default_storage.delete(new_path)
                except Exception:
                    pass
            raise
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
        ).exclude(status='pending_payment').select_related(
            'nutritionist__user'
        ).order_by('-created_at')

        serializer = ClientConsultationSerializer(consultations, many=True)
        return Response({"status": "success", "data": serializer.data})


class ConsultationBookView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({
            "status": "error",
            "message": "This endpoint is deprecated and disabled. Use the /api/marketplace/checkout/ flow.",
            "code": "ENDPOINT_DEPRECATED"
        }, status=status.HTTP_410_GONE)



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
        return self._advance(request, pk)

    def post(self, request, pk):
        return self._advance(request, pk)

    def _advance(self, request, pk):
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

        if user_plan.current_day_index + 1 >= duration:
            user_plan.current_day_index = duration - 1
            user_plan.status = 'completed'
            user_plan.save()
            return Response({
                "status": "success",
                "message": "🎉 Congratulations! You completed the plan!",
                "data": {
                    "current_day_index": user_plan.current_day_index,
                    "status":            user_plan.status,
                    "progress_percent":  100.0,
                    "is_completed":      True
                }
            })
        else:
            user_plan.current_day_index += 1
            user_plan.save()
            progress = round((user_plan.current_day_index / duration) * 100, 1)
            return Response({
                "status": "success",
                "data": {
                    "current_day_index": user_plan.current_day_index,
                    "status":            user_plan.status,
                    "progress_percent":  progress,
                    "is_completed":      False
                }
            })


# ── Invoices ───────────────────────────────────────────────────────────────────

class ClientInvoiceListView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        from marketplace.models import Invoice
        from nutritionist.serializers import InvoiceSerializer

        invoices = Invoice.objects.filter(
            client=client
        ).select_related('nutritionist__user').order_by('-created_at')

        return Response({
            "status": "success",
            "data":   InvoiceSerializer(invoices, many=True).data
        })


class InvoiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from marketplace.models import Invoice
        from nutritionist.serializers import InvoiceSerializer

        try:
            invoice = Invoice.objects.select_related(
                'client__user', 'nutritionist__user'
            ).get(id=pk)
        except Invoice.DoesNotExist:
            return Response({"status": "error", "message": "Invoice not found."}, status=404)

        # Only owner client, owner nutritionist, or admin can view
        user = request.user
        is_owner = (
            (hasattr(invoice.client, 'user')       and invoice.client.user       == user) or
            (hasattr(invoice.nutritionist, 'user') and invoice.nutritionist.user == user) or
            user.role == 'high_admin'
        )

        if not is_owner:
            return Response({"status": "error", "message": "Access denied."}, status=403)

        return Response({
            "status": "success",
            "data":   InvoiceSerializer(invoice).data
        })
    
    

# ── Service Reviews ────────────────────────────────────────────────────────────

class ServiceReviewView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        serializer = ServiceReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=400)

        data      = serializer.validated_data
        item_type = data['item_type']
        item_id   = data['item_id']

        # Check for duplicate review (CROSS-002)
        if ServiceReview.objects.filter(
            client=client, item_type=item_type, item_id=item_id
        ).exists():
            return Response({
                "status":  "error",
                "message": "You have already reviewed this service.",
                "code":    "ALREADY_REVIEWED"
            }, status=409)

        # Validate the item exists and belongs to this client
        if item_type == 'consultation':
            from marketplace.models import Consultation
            if not Consultation.objects.filter(
                id=item_id, client=client, status='finished'
            ).exists():
                return Response({
                    "status":  "error",
                    "message": "Consultation not found or not finished yet."
                }, status=404)

        elif item_type == 'plan':
            if not UserPlan.objects.filter(
                plan_id=item_id, client=client
            ).exists():
                return Response({
                    "status":  "error",
                    "message": "You must own this plan to review it."
                }, status=403)

        review = ServiceReview.objects.create(
            client    = client,
            item_type = item_type,
            item_id   = item_id,
            rating    = data['rating'],
            comment   = data.get('comment', ''),
        )

        # ── Update nutritionist rating idempotently via Avg() ──────────────────
        from django.db.models import Avg, Count

        nutritionist = None
        if item_type == 'consultation':
            from marketplace.models import Consultation as C

            try:
                consultation = C.objects.get(id=item_id)
                nutritionist = consultation.nutritionist
            except C.DoesNotExist:
                pass

            if nutritionist:
                nutri_consult_ids = C.objects.filter(
                    nutritionist=nutritionist,
                    status='finished',
                ).values_list('id', flat=True)

                agg = ServiceReview.objects.filter(
                    item_type='consultation',
                    item_id__in=list(nutri_consult_ids),
                ).aggregate(avg=Avg('rating'), count=Count('id'))

                nutritionist.rating = round(agg['avg'] or 0.0, 2)
                nutritionist.save(update_fields=['rating'])

        return Response({
            "status": "success",
            "data": {
                "id":                   review.id,
                "item_type":            review.item_type,
                "item_id":              review.item_id,
                "rating":               review.rating,
                "comment":              review.comment,
                "nutritionist_rating":  nutritionist.rating if nutritionist else None,
            }
        }, status=201)


# ── Plan Rating ────────────────────────────────────────────────────────────────

class PlanRatingView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        # Plan must exist and be approved
        try:
            plan = Plan.objects.get(id=pk, status='approved')
        except Plan.DoesNotExist:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        # Client must own the plan
        if not UserPlan.objects.filter(
            client=client, plan=plan
        ).exists():
            return Response({
                "status":  "error",
                "message": "You must own this plan to rate it."
            }, status=403)

        # Check duplicate rating
        if PlanRating.objects.filter(plan=plan, client=client).exists():
            return Response({
                "status":  "error",
                "message": "You have already rated this plan.",
                "code":    "DUPLICATE_RATING"
            }, status=409)

        serializer = PlanRatingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=400)

        # Create rating
        PlanRating.objects.create(
            plan   = plan,
            client = client,
            rating = serializer.validated_data['rating'],
        )

        # Recalculate plan average rating
        all_ratings = PlanRating.objects.filter(plan=plan)
        avg = sum(r.rating for r in all_ratings) / all_ratings.count()
        plan.rating_avg = round(avg, 2)
        plan.save()

        return Response({
            "status": "success",
            "data": {
                "plan_id":    plan.id,
                "rating_avg": plan.rating_avg,
            }
        }, status=201)


# ── Feedback to Admin ──────────────────────────────────────────────────────────

class ClientFeedbackCreateView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request):
        serializer = CreateFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=400)

        feedback = FeedbackToAdmin.objects.create(
            user    = request.user,
            subject = serializer.validated_data['subject'],
            message = serializer.validated_data['message'],
            status  = 'open',
        )

        from .serializers import FeedbackSerializer
        return Response({
            "status": "success",
            "data":   FeedbackSerializer(feedback).data
        }, status=201)


class ClientFeedbackListView(APIView):
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        from .serializers import FeedbackSerializer
        feedbacks = FeedbackToAdmin.objects.filter(
            user=request.user
        ).order_by('-created_at')

        return Response({
            "status": "success",
            "data":   FeedbackSerializer(feedbacks, many=True).data
        })
    

# ── AI Calorie Tracker ─────────────────────────────────────────────────────────

from django.http import HttpResponse, Http404
from django.core.files.storage import default_storage
from rest_framework.throttling import UserRateThrottle
from utils.upload_security import validate_and_normalize_meal_image, validate_request_content_length
from . import job_queue, ai_processor
from .ai_errors import SAFE_ERROR_MESSAGES, safe_error_message

import logging
logger = logging.getLogger(__name__)
from nutriplatform.middleware.rls import set_rls_context


class AICalorieBurstThrottle(UserRateThrottle):
    scope = 'ai_submit'

    def get_rate(self):
        burst = getattr(settings, 'AI_BURST_PER_MINUTE_PER_USER', getattr(settings, 'AI_BURST_RATE_LIMIT', 6))
        if isinstance(burst, str):
            return burst
        return f"{burst}/minute"

    def allow_request(self, request, view):
        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)
        try:
            return super().allow_request(request, view)
        except Exception:
            # Burst throttle fails open if cache is unavailable
            return True


class AICalorieSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [AICalorieBurstThrottle]

    def post(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        # 1. Fast Content-Length validation before reading payload
        validate_request_content_length(request)

        image = request.FILES.get('image')
        meal_type = request.data.get('meal_type')

        if not image:
            return Response({"status": "error", "message": "image file is required.", "code": "IMAGE_REQUIRED"}, status=400)

        if meal_type not in ['breakfast', 'lunch', 'dinner', 'snack']:
            return Response({
                "status": "error",
                "code": "INVALID_MEAL_TYPE",
                "message": "meal_type must be: breakfast, lunch, dinner, or snack."
            }, status=400)

        now = timezone.now()
        max_age_seconds = getattr(settings, 'AI_JOB_MAX_AGE_SECONDS', 180)

        # Atomic lock on the client row to serialize concurrent double-submits
        with transaction.atomic():
            client_locked = Client.objects.select_for_update().get(pk=client.pk)

            # 2. Abuse Control: per-user in-flight limit (AI_MAX_IN_FLIGHT_PER_USER, default 1).
            #    Jobs older than the deadline are failed first so a stuck job can never block the user forever.
            max_in_flight = getattr(settings, 'AI_MAX_IN_FLIGHT_PER_USER', getattr(settings, 'AI_IN_FLIGHT_JOB_LIMIT', 1))
            in_flight_states = [AICalorieLog.Status.QUEUED, AICalorieLog.Status.PROCESSING]
            AICalorieLog.objects.filter(
                client=client_locked,
                status__in=in_flight_states,
                logged_at__lt=now - timedelta(seconds=max_age_seconds),
            ).update(
                status=AICalorieLog.Status.FAILED,
                error_code=AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT,
                error_message=f"Job exceeded maximum queue lifetime of {max_age_seconds}s",
                completed_at=now,
                updated_at=now,
            )
            active_jobs = list(
                AICalorieLog.objects.filter(client=client_locked, status__in=in_flight_states).order_by('logged_at')
            )
            if len(active_jobs) >= max_in_flight:
                return Response({
                    "status": "error",
                    "code": "IN_FLIGHT_JOB_EXISTS",
                    "message": SAFE_ERROR_MESSAGES["IN_FLIGHT_JOB_EXISTS"],
                    "active_job_id": active_jobs[0].id
                }, status=status.HTTP_409_CONFLICT)

            # 3. Abuse Control: Rolling 24-hour Quota (30/day, excluding system/terminal failures)
            SYSTEM_FAILURE_CODES = [
                AICalorieLog.ErrorCode.AI_SERVICE_UNAVAILABLE,
                AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT,
                AICalorieLog.ErrorCode.AI_INFERENCE_ERROR,
                AICalorieLog.ErrorCode.NUTRITION_API_ERROR,
                AICalorieLog.ErrorCode.WORKER_CRASHED,
                AICalorieLog.ErrorCode.LEGACY_ABANDONED
            ]
            max_daily = getattr(settings, 'AI_MAX_DAILY_PER_USER', getattr(settings, 'AI_DAILY_QUOTA_LIMIT', 30))
            since_24h = now - timedelta(hours=24)
            daily_count = AICalorieLog.objects.filter(
                client=client_locked,
                logged_at__gte=since_24h
            ).exclude(error_code__in=SYSTEM_FAILURE_CODES).count()

            if daily_count >= max_daily:
                oldest_log = AICalorieLog.objects.filter(
                    client=client_locked,
                    logged_at__gte=since_24h
                ).exclude(error_code__in=SYSTEM_FAILURE_CODES).order_by('logged_at').first()
                resets_at = (oldest_log.logged_at + timedelta(hours=24)).isoformat() if oldest_log else (now + timedelta(hours=24)).isoformat()
                return Response({
                    "status": "error",
                    "code": "DAILY_QUOTA_EXCEEDED",
                    "message": SAFE_ERROR_MESSAGES["DAILY_QUOTA_EXCEEDED"],
                    "limit": max_daily,
                    "resets_at": resets_at
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)

            # 4. Abuse Control: Platform Global Queue Cap (elevated RLS scope, strictly read-only, reset immediately)
            global_cap = getattr(settings, 'AI_GLOBAL_QUEUE_CAP', 30)
            set_rls_context(is_system_worker=True)
            try:
                global_in_flight = AICalorieLog.objects.filter(
                    status__in=[AICalorieLog.Status.QUEUED, AICalorieLog.Status.PROCESSING]
                ).count()
            finally:
                set_rls_context(request.user)

            if global_in_flight >= global_cap:
                return Response({
                    "status": "error",
                    "code": "SYSTEM_BUSY",
                    "message": SAFE_ERROR_MESSAGES["SYSTEM_BUSY"],
                    "retry_after": 5
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # 5. Image Sanitization & Normalization (max 2048px, bounds check, stripped EXIF)
            from rest_framework.exceptions import ValidationError as DRFValidationError
            try:
                if hasattr(image, 'seek'):
                    image.seek(0)
                content_file, meta = validate_and_normalize_meal_image(image)
                image_filename = f"{uuid.uuid4().hex}.jpg"
                image_path = default_storage.save(
                    f"ai_logs/original/{client.client_id}/{image_filename}",
                    content_file
                )
            except DRFValidationError as e:
                # Validator messages are written for end users (size/resolution/format).
                detail = e.detail.get('file', str(e.detail)) if isinstance(e.detail, dict) else str(e.detail)
                return Response({"status": "error", "message": str(detail), "code": "IMAGE_INVALID"}, status=400)
            except Exception:
                logger.exception("Unexpected failure normalizing AI meal image for client #%s", client.pk)
                return Response({
                    "status": "error",
                    "message": SAFE_ERROR_MESSAGES["IMAGE_INVALID"],
                    "code": "IMAGE_INVALID",
                }, status=400)

            # 6. Create AICalorieLog in QUEUED status (committed atomically with the in-flight check above)
            log = AICalorieLog.objects.create(
                client=client_locked,
                meal_type=meal_type,
                entry_type='ai_vision',
                image_url=image_path,
                status=AICalorieLog.Status.QUEUED,
            )

        # 7. Rollback switch (AI_ASYNC_PIPELINE=False): run the job inline, AFTER the transaction above has
        #    committed, so the client-row lock and any DB transaction are not held during the AI HTTP call.
        if not getattr(settings, 'AI_ASYNC_PIPELINE', True):
            claimed = job_queue.claim_next_job(worker_id="inline-sync")
            if claimed is not None and claimed.id == log.id:
                success = ai_processor.process_calorie_job(claimed)
                log.refresh_from_db()
                if success and log.status == AICalorieLog.Status.PENDING_USER_REVIEW:
                    predictions = log.ai_raw_prediction.get('predictions', []) if log.ai_raw_prediction else []
                    # Same envelope and field names the pre-async frontend consumed
                    # (log_id/status/predictions/nutrition_preview), plus overlay_url. The internal storage
                    # path is deliberately not returned; the image is served by the owner-only overlay endpoint.
                    return Response({
                        "status": "success",
                        "data": {
                            "log_id": log.id,
                            "status": log.status,
                            "meal_type": log.meal_type,
                            "overlay_url": (
                                f"/api/v1/client/calorie-tracker/ai/{log.id}/overlay/" if log.segmented_image_url else None
                            ),
                            "predictions": predictions,
                            "nutrition_preview": {
                                "total_calories": log.total_calories,
                                "total_protein": log.total_protein,
                                "total_carbs": log.total_carbs,
                                "total_fats": log.total_fats,
                            },
                            "logged_at": log.logged_at
                        }
                    }, status=status.HTTP_202_ACCEPTED)
                return Response({
                    "status": "error",
                    "code": log.error_code or "AI_INFERENCE_ERROR",
                    "message": safe_error_message(log.error_code or "AI_INFERENCE_ERROR"),
                    "log_id": log.id
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            # Another job was claimed first (shared inline queue): fall through to the queued response.

        # Standard Asynchronous Return
        set_rls_context(is_system_worker=True)
        try:
            queue_position = AICalorieLog.objects.filter(
                status=AICalorieLog.Status.QUEUED,
                logged_at__lte=log.logged_at
            ).count()
        finally:
            set_rls_context(request.user)

        eta_seconds = max(1, queue_position * getattr(settings, 'AI_ETA_SECONDS_PER_JOB', 3))

        return Response({
            "status": "success",
            "data": {
                "log_id": log.id,
                "status": log.status,
                "meal_type": log.meal_type,
                "queue_position": queue_position,
                "eta_seconds": eta_seconds,
                "poll_after_ms": 1000,
                "logged_at": log.logged_at
            }
        }, status=status.HTTP_202_ACCEPTED)


class AICalorieStatusView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]

    def get(self, request, log_id):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        try:
            log = AICalorieLog.objects.get(id=log_id, client=client)
        except AICalorieLog.DoesNotExist:
            return Response({"status": "error", "message": "Log not found.", "code": "NOT_FOUND"}, status=404)

        now = timezone.now()
        max_age_seconds = getattr(settings, 'AI_JOB_MAX_AGE_SECONDS', 180)

        # Conditional Deadline Evaluation on Read
        if log.status in (AICalorieLog.Status.QUEUED, AICalorieLog.Status.PROCESSING):
            if (now - log.logged_at).total_seconds() > max_age_seconds:
                AICalorieLog.objects.filter(
                    id=log.id,
                    status__in=[AICalorieLog.Status.QUEUED, AICalorieLog.Status.PROCESSING]
                ).update(
                    status=AICalorieLog.Status.FAILED,
                    error_code=AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT,
                    error_message="Job exceeded maximum queue lifetime of 180s",
                    completed_at=now,
                    updated_at=now
                )
                log.refresh_from_db()

        # Compute real-time queue position if queued
        queue_position = 0
        eta_seconds = 0
        if log.status == AICalorieLog.Status.QUEUED:
            set_rls_context(is_system_worker=True)
            try:
                queue_position = AICalorieLog.objects.filter(
                    status=AICalorieLog.Status.QUEUED,
                    logged_at__lte=log.logged_at
                ).count()
            finally:
                set_rls_context(request.user)
            eta_seconds = max(1, queue_position * getattr(settings, 'AI_ETA_SECONDS_PER_JOB', 3))

        predictions = []
        if log.ai_raw_prediction and isinstance(log.ai_raw_prediction, dict):
            predictions = log.ai_raw_prediction.get('predictions', [])

        overlay_url = None
        if log.segmented_image_url:
            overlay_url = f"/api/v1/client/calorie-tracker/ai/{log.id}/overlay/"

        poll_after_ms = 1500 if log.status in (AICalorieLog.Status.QUEUED, AICalorieLog.Status.PROCESSING) else 0

        return Response({
            "status": "success",
            "data": {
                "log_id": log.id,
                "status": log.status,
                "meal_type": log.meal_type,
                "queue_position": queue_position,
                "eta_seconds": eta_seconds,
                "poll_after_ms": poll_after_ms,
                "predictions": predictions,
                "nutrition_preview": {
                    "total_calories": log.total_calories,
                    "total_protein": log.total_protein,
                    "total_carbs": log.total_carbs,
                    "total_fats": log.total_fats,
                },
                "overlay_url": overlay_url,
                "error_code": log.error_code,
                "error_message": safe_error_message(log.error_code),
                "logged_at": log.logged_at,
                "completed_at": log.completed_at
            }
        })


class AICalorieActiveView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]

    def get(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        now = timezone.now()
        max_age_seconds = getattr(settings, 'AI_JOB_MAX_AGE_SECONDS', 180)

        # Look for in-flight job or recent pending review job
        active_log = AICalorieLog.objects.filter(
            client=client,
            status__in=[
                AICalorieLog.Status.QUEUED,
                AICalorieLog.Status.PROCESSING,
                AICalorieLog.Status.PENDING_USER_REVIEW
            ]
        ).order_by('-logged_at').first()

        if not active_log:
            return Response({"status": "success", "data": None})

        # Apply conditional deadline check if in-flight
        if active_log.status in (AICalorieLog.Status.QUEUED, AICalorieLog.Status.PROCESSING):
            if (now - active_log.logged_at).total_seconds() > max_age_seconds:
                AICalorieLog.objects.filter(
                    id=active_log.id,
                    status__in=[AICalorieLog.Status.QUEUED, AICalorieLog.Status.PROCESSING]
                ).update(
                    status=AICalorieLog.Status.FAILED,
                    error_code=AICalorieLog.ErrorCode.AI_INFERENCE_TIMEOUT,
                    error_message="Job exceeded maximum queue lifetime of 180s",
                    completed_at=now,
                    updated_at=now
                )
                active_log.refresh_from_db()

        # Delegate formatting to status view structure
        status_view = AICalorieStatusView()
        return status_view.get(request, log_id=active_log.id)


class AICalorieDiscardView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]

    def post(self, request, log_id):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        try:
            log = AICalorieLog.objects.get(id=log_id, client=client)
        except AICalorieLog.DoesNotExist:
            return Response({"status": "error", "message": "Log not found.", "code": "NOT_FOUND"}, status=404)

        now = timezone.now()
        if log.status == AICalorieLog.Status.QUEUED:
            log.status = AICalorieLog.Status.CANCELLED
            log.error_code = AICalorieLog.ErrorCode.CANCELLED
            log.error_message = "Cancelled by user"
            log.completed_at = now
            log.save(update_fields=['status', 'error_code', 'error_message', 'completed_at', 'updated_at'])
        elif log.status == AICalorieLog.Status.PENDING_USER_REVIEW:
            log.status = AICalorieLog.Status.DISCARDED
            log.completed_at = now
            log.save(update_fields=['status', 'completed_at', 'updated_at'])
        elif log.status in (AICalorieLog.Status.SAVED, AICalorieLog.Status.FAILED, AICalorieLog.Status.CANCELLED, AICalorieLog.Status.DISCARDED):
            # Idempotent return for already terminal logs
            pass
        else:
            return Response({
                "status": "error",
                "message": f"Cannot discard job currently in '{log.status}' state.",
                "code": "INVALID_STATE"
            }, status=400)

        return Response({
            "status": "success",
            "message": "AI calorie log discarded.",
            "data": {
                "log_id": log.id,
                "status": log.status
            }
        })


class AICalorieConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]

    def patch(self, request, log_id):
        return self._confirm(request, log_id)

    def post(self, request, log_id):
        return self._confirm(request, log_id)

    def _confirm(self, request, log_id):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        try:
            log = AICalorieLog.objects.get(id=log_id, client=client)
        except AICalorieLog.DoesNotExist:
            return Response({"status": "error", "message": "Log not found.", "code": "NOT_FOUND"}, status=404)

        # Idempotency: if already saved, return 200 with saved confirmation data
        if log.status == AICalorieLog.Status.SAVED:
            today = timezone.now().date()
            progress, _ = DailyProgressMetric.objects.get_or_create(client=client, log_date=today)
            return Response({
                "status": "success",
                "message": "Log already confirmed and saved.",
                "data": {
                    "log_id": log.id,
                    "status": log.status,
                    "total_calories": log.total_calories,
                    "total_protein": log.total_protein,
                    "total_carbs": log.total_carbs,
                    "total_fats": log.total_fats,
                    "daily_progress": DailyProgressSerializer(progress).data,
                }
            }, status=200)

        if log.status != AICalorieLog.Status.PENDING_USER_REVIEW:
            return Response({
                "status": "error",
                "message": f"Log not ready for confirmation (current status: {log.status}).",
                "code": "NOT_READY"
            }, status=400)

        confirm_serializer = AICalorieConfirmSerializer(data=request.data)
        if not confirm_serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Validation failed",
                "errors": confirm_serializer.errors
            }, status=400)

        validated_data = confirm_serializer.validated_data
        user_final_log = validated_data['user_final_log']
        meal_type = validated_data.get('meal_type', log.meal_type)

        try:
            from .apiNinja import get_nutrition_data
            ingredients = [
                {
                    "name": item.get('label') or item.get('name') or '',
                    "mass_grams": item['mass_grams']
                }
                for item in user_final_log
            ]
            nutrition = get_nutrition_data(ingredients)
        except ValueError as ve:
            return Response({"status": "error", "message": str(ve), "code": "INVALID_INGREDIENTS"}, status=400)
        except Exception as e:
            return Response({"status": "error", "message": f"Could not calculate nutrition: {str(e)}", "code": "NUTRITION_API_ERROR"}, status=503)

        with transaction.atomic():
            log.user_final_log = user_final_log
            log.meal_type = meal_type
            log.total_calories = nutrition['total_calories']
            log.total_protein = nutrition['total_protein']
            log.total_carbs = nutrition['total_carbs']
            log.total_fats = nutrition['total_fats']
            log.is_validated_by_user = True
            log.status = AICalorieLog.Status.SAVED
            log.save()

            # Update today's DailyProgressMetric
            today = timezone.now().date()
            progress, _ = DailyProgressMetric.objects.get_or_create(client=client, log_date=today)
            progress.total_calories_consumed = round(progress.total_calories_consumed + nutrition['total_calories'], 2)
            progress.total_protein_consumed = round(progress.total_protein_consumed + nutrition['total_protein'], 2)
            progress.total_carbs_consumed = round(progress.total_carbs_consumed + nutrition['total_carbs'], 2)
            progress.total_fats_consumed = round(progress.total_fats_consumed + nutrition['total_fats'], 2)
            progress.check_goal_achieved()
            progress.save()

        return Response({
            "status": "success",
            "data": {
                "log_id": log.id,
                "status": log.status,
                "total_calories": log.total_calories,
                "total_protein": log.total_protein,
                "total_carbs": log.total_carbs,
                "total_fats": log.total_fats,
                "daily_progress": DailyProgressSerializer(progress).data,
            }
        })


class AICalorieOverlayView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]

    def get(self, request, log_id):
        try:
            log = AICalorieLog.objects.select_related('client__user').get(id=log_id)
        except AICalorieLog.DoesNotExist:
            raise Http404("Segmented image not found.")

        # Strictly owner-only authorization check
        if log.client.user != request.user:
            return Response({"status": "error", "message": "Access denied."}, status=403)

        if not log.segmented_image_url or not default_storage.exists(log.segmented_image_url):
            raise Http404("Segmented image file does not exist.")

        try:
            with default_storage.open(log.segmented_image_url, 'rb') as f:
                content = f.read()
            return HttpResponse(content, content_type="image/jpeg")
        except Exception as e:
            return Response({"status": "error", "message": f"Could not read segmented image: {e}"}, status=500)


class AIQueueHealthView(APIView):
    """
    Staff-only queue monitoring and operational health inspection endpoint.
    Reports global queue statistics, oldest queued age, stale lease count,
    and live AI service liveness.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        now = timezone.now()

        set_rls_context(is_system_worker=True)
        try:
            qs = AICalorieLog.objects.all()
            counts_by_status = {
                status_choice: qs.filter(status=status_choice).count()
                for status_choice in [
                    AICalorieLog.Status.QUEUED,
                    AICalorieLog.Status.PROCESSING,
                    AICalorieLog.Status.PENDING_USER_REVIEW,
                    AICalorieLog.Status.SAVED,
                    AICalorieLog.Status.FAILED,
                    AICalorieLog.Status.CANCELLED,
                ]
            }

            oldest_queued = qs.filter(status=AICalorieLog.Status.QUEUED).order_by('logged_at').first()
            oldest_queued_age_sec = None
            if oldest_queued:
                oldest_queued_age_sec = round((now - _ensure_aware(oldest_queued.logged_at)).total_seconds(), 2)

            lease_timeout = getattr(settings, 'AI_JOB_LEASE_TIMEOUT_SECONDS', 90)
            stale_threshold = now - timedelta(seconds=lease_timeout)
            stale_leases_count = qs.filter(
                status=AICalorieLog.Status.PROCESSING,
                claimed_at__lt=stale_threshold
            ).count()

            if oldest_queued_age_sec is not None and oldest_queued_age_sec > 60.0:
                queue_status = "degraded"
            elif stale_leases_count > 0:
                queue_status = "warning"
            else:
                queue_status = "healthy"
        finally:
            set_rls_context(request.user)

        ai_health_status = "unknown"
        ai_latency_ms = None
        try:
            import httpx
            import time
            ai_url = getattr(settings, "AI_SERVICE_URL", "http://127.0.0.1:8001").rstrip('/') + "/health"
            t0 = time.perf_counter()
            resp = httpx.get(ai_url, timeout=2.0)
            ai_latency_ms = round((time.perf_counter() - t0) * 1000, 2)
            if resp.status_code == 200:
                ai_health_status = "healthy"
            else:
                ai_health_status = f"unhealthy (HTTP {resp.status_code})"
        except Exception as e:
            ai_health_status = f"unreachable ({type(e).__name__})"

        overall_status = "healthy"
        if queue_status == "degraded" or "unhealthy" in ai_health_status or "unreachable" in ai_health_status:
            overall_status = "degraded"
        elif queue_status == "warning":
            overall_status = "warning"

        return Response({
            "status": "success",
            "data": {
                "overall_status": overall_status,
                "queue": {
                    "status": queue_status,
                    "queued": counts_by_status.get(AICalorieLog.Status.QUEUED, 0),
                    "processing": counts_by_status.get(AICalorieLog.Status.PROCESSING, 0),
                    "pending_user_review": counts_by_status.get(AICalorieLog.Status.PENDING_USER_REVIEW, 0),
                    "saved": counts_by_status.get(AICalorieLog.Status.SAVED, 0),
                    "failed": counts_by_status.get(AICalorieLog.Status.FAILED, 0),
                    "cancelled": counts_by_status.get(AICalorieLog.Status.CANCELLED, 0),
                    "oldest_queued_age_sec": oldest_queued_age_sec,
                    "stale_leases_count": stale_leases_count,
                    "max_global_queued_limit": getattr(settings, "AI_MAX_GLOBAL_QUEUE_CAP", getattr(settings, "AI_GLOBAL_QUEUE_CAP", 100)),
                },
                "ai_service": {
                    "status": ai_health_status,
                    "latency_ms": ai_latency_ms,
                    "url": getattr(settings, "AI_SERVICE_URL", "http://127.0.0.1:8001"),
                },
                "timestamp": now.isoformat(),
            }
        })
