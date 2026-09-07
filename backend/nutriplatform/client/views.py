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
    UserPlanListSerializer,
    ServiceReviewSerializer,
    PlanRatingSerializer,
    CreateFeedbackSerializer,

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
from .ai_processor import process_ai_image
from users.permissions import IsPremiumClient
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone



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
        return Response({
            "status": "error",
            "message": "Direct booking is deprecated. Please initiate booking through /api/marketplace/checkout/session/.",
            "code": "CHECKOUT_REQUIRED"
        }, status=status.HTTP_400_BAD_REQUEST)



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

        # ── Update nutritionist rating ─────────────────────────────────────────
        nutritionist = None
        if item_type == 'consultation':
            from marketplace.models import Consultation as C

            try:
                consultation = C.objects.get(id=item_id)
                nutritionist = consultation.nutritionist
            except C.DoesNotExist:
                pass

            if nutritionist:
                # Get all finished consultation IDs for this nutritionist
                nutri_consult_ids = C.objects.filter(
                    nutritionist = nutritionist,
                    status       = 'finished',
                ).values_list('id', flat=True)

                # Get all reviews for those consultations
                all_reviews = ServiceReview.objects.filter(
                    item_type   = 'consultation',
                    item_id__in = list(nutri_consult_ids),
                )

                if all_reviews.exists():
                    avg = round(
                        sum(r.rating for r in all_reviews) / all_reviews.count(), 2
                    )
                    nutritionist.rating = avg
                    nutritionist.save()

                    print(f"DEBUG: Nutritionist {nutritionist.nutritionist_id} rating updated to {avg}")

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

class AICalorieSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        image     = request.FILES.get('image')
        meal_type = request.data.get('meal_type')

        if not image:
            return Response({"status": "error", "message": "image file is required."}, status=400)

        if meal_type not in ['breakfast', 'lunch', 'dinner', 'snack']:
            return Response({
                "status":  "error",
                "message": "meal_type must be: breakfast, lunch, dinner, or snack."
            }, status=400)

        if image.size > 10 * 1024 * 1024:
            return Response({"status": "error", "message": "Image must be under 10 MB."}, status=400)

        # Save original image
        from django.core.files.storage import default_storage
        image_path = default_storage.save(
            f'ai_logs/original/{client.client_id}/{image.name}',
            image
        )

        # Create log with processing status
        log = AICalorieLog.objects.create(
            client     = client,
            meal_type  = meal_type,
            entry_type = 'ai_vision',
            image_url  = image_path,
            status     = 'processing',
        )

        # ── Call FastAPI AI service ────────────────────────────────────────────
        try:
            from .ai_processor import (
                process_ai_image,
                save_segmented_image,
                aggregate_nutrition_from_ai,
            )

            # Reopen saved image for sending
            image.seek(0)
            ai_result = process_ai_image(image)

            # Save segmented image returned by FastAPI
            segmented_path = save_segmented_image(
                client_id = client.client_id,
                log_id    = log.id,
                base64_str = ai_result['segmented_image_base64'],
            )

            # Aggregate nutrition from AI service response
            nutrition = aggregate_nutrition_from_ai(ai_result['nutrition_items'])

            # Update log with AI results
            log.ai_raw_prediction   = ai_result['ai_raw_prediction']
            log.segmented_image_url = segmented_path
            log.status              = 'pending_user_review'
            log.save()

        except Exception as e:
            log.status = 'failed'
            log.save()
            return Response({
                "status":  "error",
                "message": str(e),
                "log_id":  log.id,
                "code":    "AI_SERVICE_UNAVAILABLE"
            }, status=503)

        # Build frontend-friendly predictions list
        predictions = ai_result['ai_raw_prediction'].get('predictions', [])

        return Response({
            "status": "success",
            "data": {
                "log_id":   log.id,
                "status":   log.status,
                "meal_type": log.meal_type,
                "segmented_image_url": segmented_path,
                "predictions": predictions,   # frontend shows these for user to confirm
                "nutrition_preview": {        # estimated totals before user confirms
                    "total_calories": nutrition['total_calories'],
                    "total_protein":  nutrition['total_protein'],
                    "total_carbs":    nutrition['total_carbs'],
                    "total_fats":     nutrition['total_fats'],
                }
            }
        }, status=202)

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
            return Response({"status": "error", "message": "Log not found."}, status=404)

        # ── Safe JSON handling ─────────────────────────────────────────────────
        import json

        def safe_json(value):
            if value is None:
                return None
            if isinstance(value, (dict, list)):
                return value        # already parsed — return as is
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return value
            return value

        return Response({
            "status": "success",
            "data": {
                "log_id":              log.id,
                "status":              log.status,
                "meal_type":           log.meal_type,
                "ai_raw_prediction":   safe_json(log.ai_raw_prediction),
                "segmented_image_url": log.segmented_image_url,
                "logged_at":           log.logged_at,
            }
        })

class AICalorieConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsPremiumClient]

    def patch(self, request, log_id):
        try:
            client = Client.objects.get(user=request.user)
        except Client.DoesNotExist:
            return Response({"status": "error", "message": "Client not found."}, status=404)

        try:
            log = AICalorieLog.objects.get(
                id     = log_id,
                client = client,
                status = 'pending_user_review'
            )
        except AICalorieLog.DoesNotExist:
            return Response({
                "status":  "error",
                "message": "Log not found or not ready for confirmation."
            }, status=404)

        user_final_log = request.data.get('user_final_log')
        meal_type      = request.data.get('meal_type', log.meal_type)

        if not user_final_log or not isinstance(user_final_log, list):
            return Response({
                "status":  "error",
                "message": "user_final_log must be a list of {label, mass_grams}."
            }, status=400)

        # Recalculate nutrition with user-corrected masses
        # using CalorieNinjas (same as manual tracker for consistency)
        try:
            from .apiNinja import get_nutrition_data
            ingredients = [
                {
                    "name":       item.get('label', ''),
                    "mass_grams": item.get('mass_grams', 100)
                }
                for item in user_final_log
            ]
            nutrition = get_nutrition_data(ingredients)

        except Exception as e:
            return Response({
                "status":  "error",
                "message": f"Could not calculate nutrition: {str(e)}"
            }, status=503)

        with transaction.atomic():
            log.user_final_log       = user_final_log
            log.meal_type            = meal_type
            log.total_calories       = nutrition['total_calories']
            log.total_protein        = nutrition['total_protein']
            log.total_carbs          = nutrition['total_carbs']
            log.total_fats           = nutrition['total_fats']
            log.is_validated_by_user = True
            log.status               = 'saved'
            log.save()

            # Update today's DailyProgressMetric
            today       = timezone.now().date()
            progress, _ = DailyProgressMetric.objects.get_or_create(
                client=client, log_date=today
            )
            progress.total_calories_consumed = round(
                progress.total_calories_consumed + nutrition['total_calories'], 2
            )
            progress.total_protein_consumed = round(
                progress.total_protein_consumed + nutrition['total_protein'], 2
            )
            progress.total_carbs_consumed = round(
                progress.total_carbs_consumed + nutrition['total_carbs'], 2
            )
            progress.total_fats_consumed = round(
                progress.total_fats_consumed + nutrition['total_fats'], 2
            )
            progress.check_goal_achieved()
            progress.save()

        return Response({
            "status": "success",
            "data": {
                "log_id":         log.id,
                "status":         log.status,
                "total_calories": log.total_calories,
                "total_protein":  log.total_protein,
                "total_carbs":    log.total_carbs,
                "total_fats":     log.total_fats,
                "daily_progress": DailyProgressSerializer(progress).data,
            }
        })
    

    
