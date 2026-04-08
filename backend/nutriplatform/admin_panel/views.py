from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Country, Goal, Specialization
from nutritionist.models import Language


class CountryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = list(Country.objects.values('id', 'name').order_by('name'))
        return Response({"status": "success", "data": data})


class GoalListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = list(Goal.objects.values('id', 'name').order_by('name'))
        return Response({"status": "success", "data": data})


class SpecializationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = list(Specialization.objects.values('id', 'name').order_by('name'))
        return Response({"status": "success", "data": data})


class LanguageListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = list(Language.objects.values('id', 'name').order_by('name'))
        return Response({"status": "success", "data": data})