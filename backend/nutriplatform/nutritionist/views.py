from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import Language
from .serializers import LanguageSerializer

# Create your views here.
class LanguageListView(ListAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [AllowAny]