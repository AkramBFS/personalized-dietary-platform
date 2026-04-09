from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import Country, Goal, Specialization
from .serializers import CountrySerializer , GoalSerializer , SpecializationSerializer



class CountryListView(ListAPIView):
    permission_classes = [AllowAny]
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    


class GoalListView(ListAPIView):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer
    permission_classes = [AllowAny]


class SpecializationListView(ListAPIView):
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [AllowAny]


