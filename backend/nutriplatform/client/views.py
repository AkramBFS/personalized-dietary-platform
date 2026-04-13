from datetime import date, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from users.permissions import IsClient
from .models import Client, DailyProgressMetric, AICalorieLog
from .serializers import (
    ClientProfileSerializer,
    MacroTargetSerializer,
    DailyProgressSerializer,
    ManualCalorieLogSerializer,
    CalorieLogSerializer,
)
from .apiNinja import get_nutrition_data

from django.utils import timezone
from django.db import transaction



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