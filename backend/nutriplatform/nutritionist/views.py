from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import Language
from .serializers import LanguageSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.files.storage import default_storage

from users.permissions import IsNutritionist
from .models import (
    Nutritionist, NutritionistLanguage, Language,
    NutritionistAvailability, NutritionistHoliday,
)
from .serializers import (
    NutritionistProfileSerializer,
    AvailabilitySerializer,
    AvailabilityInputSerializer,
    HolidaySerializer,
    ConsultationSerializer,
    NutritionistPatient,
    PatientNote,
)
from marketplace.models import Consultation

from marketplace.models import Plan , Invoice
from .serializers import NutritionistPlanSerializer, CreatePlanSerializer
from client.models import Client

# Create your views here 
class LanguageListView(ListAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [AllowAny]


# ── Helper ─────────────────────────────────────────────────────────────────────

def get_nutritionist(user):
    try:
        return Nutritionist.objects.select_related(
            'user', 'country', 'specialization'
        ).get(user=user)
    except Nutritionist.DoesNotExist:
        return None


# ── Profile ────────────────────────────────────────────────────────────────────

class NutritionistProfileView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]
    
    def get(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        serializer = NutritionistProfileSerializer(nutritionist)
        return Response({"status": "success", "data": serializer.data})

    def patch(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        # Handle profile photo upload
        photo = request.FILES.get('profile_photo')
        if photo:
            path = default_storage.save(
                f'profiles/nutritionists/{request.user.id}_{photo.name}',
                photo
            )
            nutritionist.profile_photo_url = path

        # Update simple fields
        allowed = ['bio', 'years_experience', 'consultation_price']
        for field in allowed:
            if field in request.data:
                setattr(nutritionist, field, request.data[field])

        # Handle language_ids replacement
        language_ids = request.data.get('language_ids')
        if language_ids:
            # Validate all language IDs exist
            if isinstance(language_ids, str):
                import json
                language_ids = json.loads(language_ids)

            valid_langs = Language.objects.filter(id__in=language_ids)
            if valid_langs.count() != len(language_ids):
                return Response({
                    "status": "error",
                    "message": "One or more language IDs are invalid."
                }, status=400)

            # Replace all languages
            NutritionistLanguage.objects.filter(nutritionist=nutritionist).delete()
            NutritionistLanguage.objects.bulk_create([
                NutritionistLanguage(nutritionist=nutritionist, language_id=lid)
                for lid in language_ids
            ])

        nutritionist.save()
        serializer = NutritionistProfileSerializer(nutritionist)
        return Response({"status": "success", "data": serializer.data})


# ── Schedule ───────────────────────────────────────────────────────────────────

class ScheduleView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def get(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        availability = NutritionistAvailability.objects.filter(
            nutritionist=nutritionist
        ).order_by('day_of_week')

        holidays = NutritionistHoliday.objects.filter(
            nutritionist=nutritionist
        ).order_by('holiday_date')

        return Response({
            "status": "success",
            "data": {
                "availability": AvailabilitySerializer(availability, many=True).data,
                "holidays":     HolidaySerializer(holidays, many=True).data,
            }
        })


class AvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def put(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        # Validate input
        availability_data = request.data.get('availability', [])
        if not availability_data:
            return Response({
                "status": "error",
                "message": "availability field is required."
            }, status=400)

        serializer = AvailabilityInputSerializer(data=availability_data, many=True)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Validation failed",
                "errors": serializer.errors
            }, status=400)

        # Atomic: delete old + bulk create new
        with transaction.atomic():
            NutritionistAvailability.objects.filter(nutritionist=nutritionist).delete()
            NutritionistAvailability.objects.bulk_create([
                NutritionistAvailability(
                    nutritionist = nutritionist,
                    day_of_week  = item['day_of_week'],
                    start_time   = item['start_time'],
                    end_time     = item['end_time'],
                )
                for item in serializer.validated_data
            ])

        # Return updated schedule
        availability = NutritionistAvailability.objects.filter(
            nutritionist=nutritionist
        ).order_by('day_of_week')

        return Response({
            "status": "success",
            "data": AvailabilitySerializer(availability, many=True).data
        })


# ── Holidays ───────────────────────────────────────────────────────────────────

class HolidayView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def post(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        holiday_date = request.data.get('holiday_date')
        if not holiday_date:
            return Response({
                "status": "error",
                "message": "holiday_date is required."
            }, status=400)

        # Check duplicate
        if NutritionistHoliday.objects.filter(
            nutritionist=nutritionist,
            holiday_date=holiday_date
        ).exists():
            return Response({
                "status": "error",
                "message": "This date is already marked as a holiday."
            }, status=409)

        holiday = NutritionistHoliday.objects.create(
            nutritionist = nutritionist,
            holiday_date = holiday_date,
        )

        return Response({
            "status": "success",
            "data": HolidaySerializer(holiday).data
        }, status=201)


class HolidayDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def delete(self, request, pk):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        try:
            holiday = NutritionistHoliday.objects.get(
                id=pk,
                nutritionist=nutritionist
            )
        except NutritionistHoliday.DoesNotExist:
            return Response({"status": "error", "message": "Holiday not found."}, status=404)

        holiday.delete()
        return Response({"status": "success", "message": "Holiday removed."}, status=204)


# ── Consultations ──────────────────────────────────────────────────────────────

class NutritionistConsultationListView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def get(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        consultations = Consultation.objects.filter(
            nutritionist=nutritionist
        ).select_related('client__user')

        # Optional filters
        status_filter = request.query_params.get('status')
        type_filter   = request.query_params.get('type')

        if status_filter:
            consultations = consultations.filter(status=status_filter)
        if type_filter:
            consultations = consultations.filter(consultation_type=type_filter)

        consultations = consultations.order_by('-created_at')
        serializer = ConsultationSerializer(consultations, many=True)
        return Response({"status": "success", "data": serializer.data})


class ConsultationZoomView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def patch(self, request, pk):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        zoom_link = request.data.get('zoom_link')
        if not zoom_link:
            return Response({
                "status": "error",
                "message": "zoom_link is required."
            }, status=400)

        try:
            consultation = Consultation.objects.get(
                id=pk,
                nutritionist=nutritionist
            )
        except Consultation.DoesNotExist:
            return Response({"status": "error", "message": "Consultation not found."}, status=404)

        consultation.zoom_link = zoom_link
        consultation.save()
        from notifications.utils import notify

        notify(
            recipient   = consultation.client.user,
            sender      = request.user,
            title       = 'Zoom Link Added',
            message     = f'Your nutritionist added a zoom link for your consultation.',
            target_type = 'consultation',
            target_id   = consultation.id,
        )

        return Response({
            "status": "success",
            "data": ConsultationSerializer(consultation).data
        })


class ConsultationStatusView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    ALLOWED_STATUSES = ['notified', 'finished', 'cancelled']

    def patch(self, request, pk):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        new_status = request.data.get('status')
        if not new_status:
            return Response({
                "status": "error",
                "message": "status is required."
            }, status=400)

        if new_status not in self.ALLOWED_STATUSES:
            return Response({
                "status": "error",
                "message": f"Invalid status. Must be one of: {self.ALLOWED_STATUSES}"
            }, status=400)

        try:
            consultation = Consultation.objects.get(
                id=pk,
                nutritionist=nutritionist
            )
        except Consultation.DoesNotExist:
            return Response({"status": "error", "message": "Consultation not found."}, status=404)

        consultation.status = new_status
        consultation.save()

        return Response({
            "status": "success",
            "data": ConsultationSerializer(consultation).data
        })



# ── Plan Management ────────────────────────────────────────────────────────────

class NutritionistPlanListView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]
    




    def get(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        plans = Plan.objects.filter(
            creator = nutritionist
        ).exclude(status='deleted').order_by('-created_at')

        serializer = NutritionistPlanSerializer(plans, many=True)
        return Response({"status": "success", "data": serializer.data})

    def post(self, request):

        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        serializer = CreatePlanSerializer(data=request.data)

    
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Validation failed",
                "errors": serializer.errors
            }, status=400)

        
        data = serializer.validated_data

        import json
        content_json = data['content_json']

        
        if isinstance(content_json, str):
            try:
                content_json = json.loads(content_json)
            except json.JSONDecodeError:
                return Response({
                    "status": "error",
                    "message": "Invalid JSON format for content_json"
                }, status=400)

        # Handle cover image upload
        cover_image     = request.FILES.get('cover_image')
        cover_image_url = 'default_plan_cover.jpg'
        if cover_image:
            path = default_storage.save(
                f'plans/covers/{nutritionist.nutritionist_id}_{cover_image.name}',
                cover_image
            )
            cover_image_url = path

        # Validate target_client
        target_client = None
        if data.get('target_client_id'):
            try:
                target_client = Client.objects.get(client_id=data['target_client_id'])
            except Client.DoesNotExist:
                return Response({
                    "status": "error",
                    "message": "Target client not found."
                }, status=404)

        # Status logic
        initial_status = 'pending' if data['plan_type'] == 'public-predefined' else 'approved'

        plan = Plan.objects.create(
            creator                     = nutritionist,
            title                       = data['title'],
            description                 = data['description'],
            plan_type                   = data['plan_type'],
            target_client               = target_client,
            price                       = data['price'],
            duration_days               = data['duration_days'],
            free_consultations_per_week = data.get('free_consultations_per_week', 0),
            content_json                = content_json,
            cover_image_url             = cover_image_url,
            status                      = initial_status,
        )

        return Response({
            "status": "success",
            "data":   NutritionistPlanSerializer(plan).data,
            "message": "Plan submitted for admin approval." if initial_status == 'pending'
                    else "Private plan created and active."
        }, status=201)

class NutritionistPlanDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def get_plan(self, pk, nutritionist):
        try:
            return Plan.objects.get(id=pk, creator=nutritionist)
        except Plan.DoesNotExist:
            return None

    def patch(self, request, pk):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        plan = self.get_plan(pk, nutritionist)
        if not plan:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        if plan.status == 'deleted':
            return Response({
                "status": "error",
                "message": "Cannot edit a deleted plan."
            }, status=400)

        import json

        allowed = [
            'title', 'description', 'price',
            'duration_days', 'free_consultations_per_week',
            'content_json',
        ]

        for field in allowed:
            if field in request.data:
                value = request.data[field]

                if field == 'content_json' and isinstance(value, str):
                    try:
                        value = json.loads(value)
                    except json.JSONDecodeError:
                        return Response({
                            "status": "error",
                            "message": "Invalid JSON format"
                        }, status=400)

                setattr(plan, field, value)

        # cover image
        cover_image = request.FILES.get('cover_image')
        if cover_image:
            path = default_storage.save(
                f'plans/covers/{nutritionist.nutritionist_id}_{cover_image.name}',
                cover_image
            )
            plan.cover_image_url = path

        # re-approval logic
        if plan.status == 'approved' and plan.plan_type == 'public-predefined':
            plan.status = 'pending'

        plan.save()

        return Response({
            "status": "success",
            "data": NutritionistPlanSerializer(plan).data
        })
    def delete(self, request, pk):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        plan = self.get_plan(pk, nutritionist)
        if not plan:
            return Response({"status": "error", "message": "Plan not found."}, status=404)

        # Soft delete
        plan.status = 'deleted'
        plan.save()

        return Response({
            "status":  "success",
            "message": "Plan deleted successfully."
        }, status=204)
    

# ── Patient Management ─────────────────────────────────────────────────────────

class NutritionistPatientListView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def get(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        patients = NutritionistPatient.objects.filter(
            nutritionist=nutritionist
        ).select_related('client__user').order_by('-first_consultation_date')

        from .serializers import NutritionistPatientListSerializer
        serializer = NutritionistPatientListSerializer(patients, many=True)
        return Response({"status": "success", "data": serializer.data})


class NutritionistPatientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def get(self, request, client_id):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        try:
            patient = NutritionistPatient.objects.select_related(
                'client__user', 'client__goal'
            ).get(nutritionist=nutritionist, client__client_id=client_id)
        except NutritionistPatient.DoesNotExist:
            return Response({"status": "error", "message": "Patient not found."}, status=404)

        from .serializers import NutritionistPatientDetailSerializer
        serializer = NutritionistPatientDetailSerializer(patient)
        return Response({"status": "success", "data": serializer.data})


class NutritionistPatientNoteView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def post(self, request, client_id):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        # Verify patient belongs to this nutritionist
        try:
            patient = NutritionistPatient.objects.get(
                nutritionist         = nutritionist,
                client__client_id    = client_id,
            )
        except NutritionistPatient.DoesNotExist:
            return Response({"status": "error", "message": "Patient not found."}, status=404)

        note_content = request.data.get('note_content')
        if not note_content:
            return Response({
                "status":  "error",
                "message": "note_content is required."
            }, status=400)

        note = PatientNote.objects.create(
            nutritionist = nutritionist,
            client       = patient.client,
            note_content = note_content,
        )

        from .serializers import PatientNoteSerializer
        return Response({
            "status": "success",
            "data":   PatientNoteSerializer(note).data
        }, status=201)


# ── Earnings ───────────────────────────────────────────────────────────────────

class NutritionistEarningsView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def get(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        invoices = Invoice.objects.filter(
            nutritionist=nutritionist
        ).order_by('-created_at')

        # Aggregate totals
        total_gross      = sum(i.total_paid    or 0 for i in invoices)
        total_net        = sum(i.net_earnings  or 0 for i in invoices)
        total_commission = round(total_gross - total_net, 2)

        from .serializers import InvoiceSerializer
        return Response({
            "status": "success",
            "data": {
                "total_gross":      round(total_gross, 2),
                "total_commission": total_commission,
                "total_net":        round(total_net, 2),
                "transactions":     InvoiceSerializer(invoices, many=True).data,
            }
        })


class NutritionistInvoiceListView(APIView):
    permission_classes = [IsAuthenticated, IsNutritionist]

    def get(self, request):
        nutritionist = get_nutritionist(request.user)
        if not nutritionist:
            return Response({"status": "error", "message": "Profile not found."}, status=404)

        invoices = Invoice.objects.filter(
            nutritionist=nutritionist
        ).select_related('client__user').order_by('-created_at')

        from .serializers import InvoiceSerializer
        return Response({"status": "success", "data": InvoiceSerializer(invoices, many=True).data})
